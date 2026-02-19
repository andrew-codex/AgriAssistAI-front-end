import api from './api';

export const diagnosisService = {
  async getDiagnosisResult(diagnosisId) {
    try {
      const response = await api.get(`/diagnosis/${diagnosisId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },



  
  async getAllCases() {
    try {
      const response = await api.get('/diagnosis/all-cases');
      return response;
    } catch (error) {
      throw error;
    }
  },

  
  async getPendingCases() {
    try {
      const response = await api.get('/diagnosis/pending-cases');
      return response;
    } catch (error) {
      throw error;
    }
  },


  async getReviewedCases() {
    try {
      const response = await api.get('/diagnosis/reviewed-cases');
      return response;
    } catch (error) {
      throw error;
    }
  },


  async submitReview(diagnosisId, review) {
    try {
      const response = await api.post(`/diagnosis/${diagnosisId}/review`, review);
      return response;
    } catch (error) {
      throw error;
    }
  },


  async deleteDiagnosis(diagnosisId) {
    try {
      const response = await api.delete(`/diagnosis/${diagnosisId}`);
      return response;
    } catch (error) {
      throw error;
    }
}
};

export default diagnosisService;
