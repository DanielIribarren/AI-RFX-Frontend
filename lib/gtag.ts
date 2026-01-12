export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Eventos de conversión predefinidos
export const trackSignUpStart = (method: string = 'email') => {
  event({
    action: 'sign_up_start',
    category: 'Conversion',
    label: method,
  })
}

export const trackSignUpComplete = (method: string = 'email') => {
  event({
    action: 'sign_up_complete',
    category: 'Conversion',
    label: method,
  })
}

export const trackFileUpload = (fileType: string) => {
  event({
    action: 'file_upload',
    category: 'Engagement',
    label: fileType,
  })
}

export const trackProposalGenerated = (industry?: string) => {
  event({
    action: 'proposal_generated',
    category: 'Engagement',
    label: industry || 'unknown',
  })
}

export const trackExportPDF = (format: string = 'pdf') => {
  event({
    action: 'export_pdf',
    category: 'Engagement',
    label: format,
  })
}

export const trackPricingView = (plan: string) => {
  event({
    action: 'pricing_view',
    category: 'Engagement',
    label: plan,
  })
}

export const trackCaseStudyView = (industry: string) => {
  event({
    action: 'case_study_view',
    category: 'Engagement',
    label: industry,
  })
}

export const trackBlogRead = (article: string) => {
  event({
    action: 'blog_read',
    category: 'Engagement',
    label: article,
  })
}
