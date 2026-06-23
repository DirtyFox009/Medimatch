import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect your name, email address, and optional phone number when you create an account. During symptom assessment, we process your symptom descriptions to provide health guidance. When you book appointments, we store appointment details including doctor, date, time, and optional symptom summaries. Medical records you upload are stored securely in your private storage space.',
  },
  {
    title: 'How We Use Your Information',
    body: 'Your information is used solely to provide MediMatch services: matching you with appropriate doctors, processing appointment bookings, sending appointment reminders, and storing your medical records. We do not sell, rent, or share your personal health information with third parties for marketing purposes.',
  },
  {
    title: 'AI Symptom Assessment',
    body: 'Symptom descriptions are processed via the Groq AI API to generate health guidance. This processing is subject to Groq\'s privacy policy. AI assessments are NOT medical diagnoses and should not replace professional medical advice. We do not store AI conversation data on our servers beyond your session.',
  },
  {
    title: 'Medical Records Storage',
    body: 'Files you upload (prescriptions, reports, scans) are stored in Firebase Storage with access restricted to your authenticated account only. Files are encrypted at rest and in transit. You can delete your records at any time from the app.',
  },
  {
    title: 'Appointment Data',
    body: 'When you book an appointment, relevant details are visible to you in your appointment history. Doctor profiles are publicly accessible for browsing. Your personal booking history is private and accessible only with your account credentials.',
  },
  {
    title: 'Data Retention',
    body: 'Your account data is retained as long as your account exists. You may request deletion of your account and all associated data by contacting us at privacy@medimatch.bd. Medical records are deleted immediately when you remove them from the app.',
  },
  {
    title: 'Security',
    body: 'We use Firebase Authentication with industry-standard encryption for account access. All data transmissions are encrypted using TLS/HTTPS. We follow security best practices to protect your health information.',
  },
  {
    title: 'Children\'s Privacy',
    body: 'MediMatch is not intended for use by children under 13. We do not knowingly collect personal information from children under 13.',
  },
  {
    title: 'Changes to This Policy',
    body: 'We may update this privacy policy from time to time. We will notify you of significant changes through the app. Continued use of MediMatch after changes constitutes acceptance of the updated policy.',
  },
  {
    title: 'Contact Us',
    body: 'For privacy-related questions or to exercise your data rights, contact us at privacy@medimatch.bd.',
  },
];

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-slate-800 mb-1">{t('privacy.title')}</Text>
        <Text className="text-slate-500 text-sm mb-6">{t('privacy.last_updated')}</Text>

        <View className="bg-blue-50 rounded-xl p-4 mb-6">
          <Text className="text-blue-800 text-sm leading-relaxed">
            MediMatch is committed to protecting your health information. This policy explains how we collect, use, and protect your personal data in compliance with Bangladesh's Digital Security Act and international privacy best practices.
          </Text>
        </View>

        {SECTIONS.map((section, i) => (
          <View key={i} className="mb-5">
            <Text className="text-base font-bold text-slate-800 mb-2">{i + 1}. {section.title}</Text>
            <Text className="text-slate-600 text-sm leading-relaxed">{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
