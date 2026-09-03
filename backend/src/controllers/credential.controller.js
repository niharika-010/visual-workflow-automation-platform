import {
  createCredential as createCredentialModel,
  getCredentialsByUserId,
  deleteCredential as deleteCredentialModel,
} from '../models/credential.model.js';

/**
 * POST /api/credentials
 */
export const createCredential = async (req, res) => {
  try {
    const { name, type, data } = req.body;
    const userId = req.user.id;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Credential name is required',
      });
    }

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Credential type is required (e.g. smtp_email, slack_webhook, postgres_db)',
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Credential data payload object is required',
      });
    }

    const credential = await createCredentialModel({
      userId,
      name,
      type,
      data,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Credential stored successfully',
      credential,
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create credential',
    });
  }
};

/**
 * GET /api/credentials
 */
export const getCredentials = async (req, res) => {
  try {
    const userId = req.user.id;
    const credentials = await getCredentialsByUserId(userId);

    return res.status(200).json({
      status: 'success',
      count: credentials.length,
      credentials,
    });
  } catch (error) {
    console.error('Error listing credentials:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to list credentials',
    });
  }
};

/**
 * DELETE /api/credentials/:id
 */
export const deleteCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await deleteCredentialModel(id, userId);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Credential not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Credential deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete credential',
    });
  }
};
