import { type APIRequestContext } from '@playwright/test';

const API_URL = process.env.API_URL || 'https://spending-api.arinze.online';

function authHeaders() {
  const cookie = process.env.TEST_SESSION_COOKIE;
  return cookie ? { Cookie: `nb_uid=${cookie}` } : {};
}

function adminAuthHeaders() {
  const cookie = process.env.ADMIN_SESSION_COOKIE;
  return cookie ? { Cookie: `on_admin_session=${cookie}` } : {};
}

export async function createTestConversation(request: APIRequestContext) {
  const res = await request.post(`${API_URL}/api/chat`, {
    headers: authHeaders(),
    data: {
      message: 'E2E test conversation',
      tool: 'auto',
      language: 'english',
    },
  });
  return res;
}

export async function deleteTestConversation(
  request: APIRequestContext,
  conversationId: string,
) {
  return request.delete(`${API_URL}/api/chat/conversations/${conversationId}`, {
    headers: authHeaders(),
  });
}

export async function createTestFeedback(request: APIRequestContext) {
  return request.post(`${API_URL}/api/feedback`, {
    headers: authHeaders(),
    data: {
      category: 'general',
      subject: 'E2E Test Feedback',
      message: 'This is automated test feedback',
    },
  });
}

export async function getAdminStats(request: APIRequestContext) {
  return request.get(`${API_URL}/api/admin/stats`, {
    headers: adminAuthHeaders(),
  });
}
