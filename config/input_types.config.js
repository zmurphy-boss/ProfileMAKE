// Accepted input types and named URL fields.
module.exports = {
  INPUT_TYPES: [
    'pdf',
    'word',
    'excel',
    'image',
    'newsletter',
    'url_website',
    'url_linkedin',
    'url_x',
    'url_facebook',
    'url_youtube',
    'url_article',
  ],
  URL_FIELDS: [
    'url_website',
    'url_linkedin',
    'url_x',
    'url_facebook',
    'url_youtube',
    'url_article',
  ],
  FILE_FIELDS: [
    'pdf',
    'word',
    'excel',
    'image',
    'newsletter',
  ],
  ACCEPTED_MIME_TYPES: {
    pdf: ['application/pdf'],
    word: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
    excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    newsletter: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};
