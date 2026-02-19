import api from './api';

export const chatService = {
  // Get chat conversations
  async getConversations() {
    try {
      const response = await api.get('/chat/conversations');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Send message
  async sendMessage(conversationId, message, attachments = []) {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        message,
        attachments,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Start new conversation
  async startConversation(recipientId, initialMessage) {
    try {
      const response = await api.post('/chat/conversations', {
        recipientId,
        message: initialMessage,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mark messages as read
  async markAsRead(conversationId) {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/read`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await api.get('/chat/unread-count');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Upload attachment
  async uploadAttachment(conversationId, fileUri, fileType) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: `attachment.${fileType.split('/')[1]}`,
      });
      
      const response = await api.uploadFile(
        `/chat/conversations/${conversationId}/attachments`,
        formData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete conversation
  async deleteConversation(conversationId) {
    try {
      const response = await api.delete(`/chat/conversations/${conversationId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default chatService;
