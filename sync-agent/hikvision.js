const axios = require('axios');
const urllib = require('urllib');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

class HikvisionClient {
  constructor() {
    this.ip = process.env.HIKVISION_DEVICE_IP || '192.168.220.2';
    this.port = process.env.HIKVISION_DEVICE_PORT || '80';
    this.user = process.env.HIKVISION_USERNAME || 'admin';
    this.pass = process.env.HIKVISION_PASSWORD || 'altrex@123';
    this.baseUrl = `http://${this.ip}:${this.port}`;
  }

  /**
   * Internal request method using HTTP Digest Authentication.
   * Hikvision Access Control Terminals strictly require Digest Auth for ISAPI.
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    
    const requestOptions = {
      method,
      digestAuth: `${this.user}:${this.pass}`,
      timeout: 10000,
      dataType: 'json',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    if (options.data) {
      requestOptions.content = JSON.stringify(options.data);
    }

    try {
      const response = await urllib.request(url, requestOptions);
      return response;
    } catch (err) {
      throw new Error(`Hikvision ISAPI Error (${method} ${endpoint}): ${err.message}`);
    }
  }

  // 1. Device Info (to verify connection & online status)
  async getDeviceInfo() {
    const res = await this._request('/ISAPI/System/deviceInfo');
    return res.data;
  }

  // 2. Check Device System Time (vital for validity expiration)
  async getDeviceTime() {
    const res = await this._request('/ISAPI/System/time');
    return res.data;
  }

  // 3. Search single user by employeeNo (device_user_id)
  async getUser(employeeNo) {
    const payload = {
      UserInfoSearchCond: {
        searchID: "1",
        searchResultPosition: 0,
        maxResults: 1,
        EmployeeNoList: [{ employeeNo: String(employeeNo) }]
      }
    };

    try {
      const res = await this._request('/ISAPI/AccessControl/UserInfo/Search?format=json', {
        method: 'POST',
        data: payload
      });
      
      const searchRes = res.data?.UserInfoSearch || res.data;
      if (searchRes && searchRes.UserInfo && searchRes.UserInfo.length > 0) {
        return searchRes.UserInfo[0];
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // 4. Update User Validity (The core function to block/allow members)
  async setUserValidity({ employeeNo, name, beginTime, endTime, enable = true }) {
    const payload = {
      UserInfo: {
        employeeNo: String(employeeNo),
        name: (name || 'Member').substring(0, 32),
        userType: 'normal',
        Valid: {
          enable: Boolean(enable),
          beginTime: beginTime, // e.g. "2026-10-01T00:00:00"
          endTime: endTime,     // e.g. "2026-11-01T23:59:59"
          timeType: 'local'
        }
      }
    };

    const res = await this._request('/ISAPI/AccessControl/UserInfo/Modify?format=json', {
      method: 'PUT',
      data: payload
    });

    const body = res.data;
    
    // Check for success responses
    const statusObj = body?.ResponseStatus || body;
    const statusCode = statusObj?.statusCode;
    const subStatusCode = statusObj?.subStatusCode || statusObj?.statusString;

    if (statusCode === 1 || subStatusCode === 'ok' || subStatusCode === 'OK') {
      return { success: true, notEnrolled: false, message: 'Updated successfully' };
    }

    // Check if user is not enrolled on hardware
    if (statusCode === 4 || subStatusCode === 'userNotExist' || String(body).includes('userNotExist')) {
      return { success: false, notEnrolled: true, message: 'User not yet enrolled on device' };
    }

    return { 
      success: false, 
      notEnrolled: false, 
      message: `Device returned status: ${statusCode} (${subStatusCode || 'Unknown'})`,
      raw: body 
    };
  }

  // 5. Delete User from device hardware
  async deleteUser(employeeNo) {
    const payload = {
      UserInfoDelCond: {
        EmployeeNoList: [{ employeeNo: String(employeeNo) }]
      }
    };
    try {
      const res = await this._request('/ISAPI/AccessControl/UserInfo/Delete?format=json', {
        method: 'PUT',
        data: payload
      });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = HikvisionClient;
