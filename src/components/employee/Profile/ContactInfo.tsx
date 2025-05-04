import React from 'react';
import { ContactInfo as ContactInfoType } from './types';

interface ContactInfoProps {
  contactInfo: ContactInfoType;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ contactInfo }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
      <div className="space-y-3">
        <div className="contact-info-item">
          <i className="bi bi-envelope text-blue-500"></i>
          <span className="text-gray-700">{contactInfo.email}</span>
        </div>
        <div className="contact-info-item">
          <i className="bi bi-telephone text-green-500"></i>
          <span className="text-gray-700">{contactInfo.phone}</span>
        </div>
        <div className="contact-info-item">
          <i className="bi bi-geo-alt text-red-500"></i>
          <span className="text-gray-700">{contactInfo.location}</span>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo; 