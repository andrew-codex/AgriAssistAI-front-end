import api from './api';

const messageService = {
  async sendMessage(receiverId, content, detectionId = null, image = null) {
    try{
      const formData = new FormData();
      formData.append('receiver_id', receiverId);
      formData.append('content', content);
      
      if (detectionId) {
        formData.append('detection_id', detectionId);
      }
      
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get conversation with a specific user
  async getConversation(userId, detectionId = null) {
    try {
      let url = `/messages/conversation/${userId}`;
      if (detectionId) {
        url += `?detection_id=${detectionId}`;
      }
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get all conversations for current user
  async getConversations() {
    try {
      const response = await api.get('/messages/conversations');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const response = await api.patch(`/messages/${messageId}/read`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await api.get('/messages/unread-count');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete conversation with a specific user
  async deleteConversation(userId, detectionId = null) {
    try {
      let url = `/messages/conversation/${userId}`;
      if (detectionId) {
        url += `?detection_id=${detectionId}`;
      }
      const response = await api.delete(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get DA worker user ID from assignment
  async getDAWorkerUserId(daWorkerId) {
    try {
      const response = await api.get(`/da-workers/${daWorkerId}/user`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default messageService;