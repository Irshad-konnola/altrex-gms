const { request } = require('urllib');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

class HikvisionClient {
  constructor(config = {}) {
    this.ip = config.ip || process.env.HIKVISION_IP || '192.168.1.100';
    this.port = config.port || process.env.HIKVISION_PORT || 80;
    this.user = config.user || process.env.HIKVISION_USER || 'admin';
    this.pass = config.pass || process.env.HIKVISION_PASS || '';
    this.baseUrl = `http://${this.ip}:${this.port}`;
    this.auth = `${this.user}:${this.pass}`;
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || 8000;

    const requestOpts = {
      method: options.method || 'GET',
      digestAuth: this.auth,
      timeout,
      headers: {
        'Accept': 'application/json, text/xml, */*',
        ...(options.headers || {})
      }
    };

    if (options.data) {
      if (typeof options.data === 'object') {
        requestOpts.headers['Content-Type'] = 'application/json';
        requestOpts.data = JSON.stringify(options.data);
      } else {
        requestOpts.data = options.data;
      }
    }

    try {
      const res = await request(url, requestOpts);
      let parsedData = res.data;
      
      // Attempt JSON parse if it's a buffer or string
      if (Buffer.isBuffer(parsedData)) {
        parsedData = parsedData.toString('utf8');
      }
      if (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch {
          // It might be XML, keep as string
        }
      }

      return {
        status: res.status,
        headers: res.headers,
        data: parsedData
      };
    } catch (err) {
      throw new Error(`Hikvision ISAPI Error (${options.method || 'GET'} ${endpoint}): ${err.message}`);
    }
  }

  // 1. Check Device Info (Firmware, Model, Serial)
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
      // If endpoint not supported, return null
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
    // Hikvision standard JSON response: { statusCode: 1, statusString: "OK", subStatusCode: "ok" }
    // Or in ResponseStatus: { statusCode: 1 }
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
}

module.exports = HikvisionClient;
