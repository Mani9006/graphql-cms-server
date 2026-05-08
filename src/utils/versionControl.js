/**
 * Content versioning system for GraphQL CMS.
 * Manages version history, diff tracking, and rollback capabilities.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Create a snapshot of an object with metadata.
 * @param {Object} content - Content to snapshot.
 * @param {string} action - Action that triggered the version ('CREATE', 'UPDATE', 'DELETE').
 * @param {string} [editorId] - ID of the editor making the change.
 * @returns {Object} Version snapshot object.
 */
function createSnapshot(content, action, editorId) {
  if (!content || typeof content !== 'object') {
    throw new Error('Content must be a valid object to create snapshot');
  }

  return {
    versionId: uuidv4(),
    contentId: content.id,
    version: (content.version || 0) + 1,
    action,
    editorId: editorId || content.authorId || null,
    snapshot: { ...content },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculate a simple diff between two objects.
 * @param {Object} oldObj - Previous version.
 * @param {Object} newObj - Current version.
 * @returns {Object} Diff object with added, removed, and modified fields.
 */
function calculateDiff(oldObj, newObj) {
  const added = {};
  const removed = {};
  const modified = {};

  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

  for (const key of allKeys) {
    if (oldObj[key] === undefined && newObj[key] !== undefined) {
      added[key] = newObj[key];
    } else if (oldObj[key] !== undefined && newObj[key] === undefined) {
      removed[key] = oldObj[key];
    } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      modified[key] = {
        from: oldObj[key],
        to: newObj[key],
      };
    }
  }

  return { added, removed, modified };
}

/**
 * Apply a diff to reconstruct a version.
 * @param {Object} base - Base object.
 * @param {Object} diff - Diff to apply.
 * @returns {Object} Reconstructed object.
 */
function applyDiff(base, diff) {
  const result = { ...base };

  if (diff.added) {
    Object.assign(result, diff.added);
  }
  if (diff.removed) {
    for (const key of Object.keys(diff.removed)) {
      delete result[key];
    }
  }
  if (diff.modified) {
    for (const [key, change] of Object.entries(diff.modified)) {
      result[key] = change.to;
    }
  }

  return result;
}

/**
 * Manage version history with storage and retrieval.
 */
class VersionManager {
  constructor() {
    this._versions = new Map();
  }

  /**
   * Store a new version snapshot.
   * @param {Object} content - Content to version.
   * @param {string} action - Action type.
   * @param {string} [editorId] - Editor identifier.
   * @returns {Object} Stored version info.
   */
  store(content, action, editorId) {
    const snapshot = createSnapshot(content, action, editorId);
    const contentId = content.id;

    if (!this._versions.has(contentId)) {
      this._versions.set(contentId, []);
    }

    const history = this._versions.get(contentId);
    history.unshift(snapshot);

    // Trim history to max versions
    if (history.length > config.versioning.maxVersions) {
      history.length = config.versioning.maxVersions;
    }

    return {
      versionId: snapshot.versionId,
      version: snapshot.version,
      createdAt: snapshot.createdAt,
    };
  }

  /**
   * Get version history for a content item.
   * @param {string} contentId - Content identifier.
   * @returns {Array} Array of version snapshots.
   */
  getHistory(contentId) {
    return this._versions.get(contentId) || [];
  }

  /**
   * Get a specific version by version ID.
   * @param {string} contentId - Content identifier.
   * @param {string} versionId - Version identifier.
   * @returns {Object|null} Version snapshot or null.
   */
  getVersion(contentId, versionId) {
    const history = this._versions.get(contentId) || [];
    return history.find(v => v.versionId === versionId) || null;
  }

  /**
   * Get the most recent version before a given version number.
   * @param {string} contentId - Content identifier.
   * @param {number} version - Version number.
   * @returns {Object|null} Previous version or null.
   */
  getPreviousVersion(contentId, version) {
    const history = this._versions.get(contentId) || [];
    return history.find(v => v.version === version - 1) || null;
  }

  /**
   * Compare two versions and return diff.
   * @param {string} contentId - Content identifier.
   * @param {number} fromVersion - Source version.
   * @param {number} toVersion - Target version.
   * @returns {Object|null} Diff result or null.
   */
  compareVersions(contentId, fromVersion, toVersion) {
    const history = this._versions.get(contentId) || [];
    const from = history.find(v => v.version === fromVersion);
    const to = history.find(v => v.version === toVersion);

    if (!from || !to) return null;

    return {
      from: fromVersion,
      to: toVersion,
      diff: calculateDiff(from.snapshot, to.snapshot),
    };
  }

  /**
   * Restore content to a specific version.
   * @param {string} contentId - Content identifier.
   * @param {number} version - Version to restore.
   * @returns {Object|null} Restored content or null.
   */
  restoreVersion(contentId, version) {
    const history = this._versions.get(contentId) || [];
    const target = history.find(v => v.version === version);

    if (!target) return null;

    return {
      ...target.snapshot,
      restoredFrom: version,
      restoredAt: new Date().toISOString(),
    };
  }

  /**
   * Purge old versions beyond the retention period.
   */
  purgeOldVersions() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - config.versioning.keepDeletedDays);

    for (const [contentId, history] of this._versions) {
      const filtered = history.filter(v => new Date(v.createdAt) > cutoff);
      if (filtered.length === 0) {
        this._versions.delete(contentId);
      } else {
        this._versions.set(contentId, filtered);
      }
    }
  }

  /**
   * Get version count for a content item.
   * @param {string} contentId - Content identifier.
   * @returns {number} Number of versions.
   */
  getVersionCount(contentId) {
    return (this._versions.get(contentId) || []).length;
  }

  /**
   * Clear all version history.
   */
  clear() {
    this._versions.clear();
  }
}

// Singleton instance
const versionManager = new VersionManager();

module.exports = {
  versionManager,
  createSnapshot,
  calculateDiff,
  applyDiff,
  VersionManager,
};
