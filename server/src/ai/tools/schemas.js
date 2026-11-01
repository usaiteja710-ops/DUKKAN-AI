/**
 * Gemini Function Declarations for BookWise AI Agent
 */
export const toolDeclarations = [
  {
    name: 'search_shops',
    description: 'Find published local shops by keyword, category, city, or service. Returns up to 5 shops.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: "Shop name or service keyword, e.g. 'haircut'" },
        category_slug: { type: 'STRING', description: "Category slug, e.g. 'salon-beauty', 'barber-shop'" },
        city: { type: 'STRING', description: 'City name, e.g. Visakhapatnam, Hyderabad, Bengaluru' },
        max_price: { type: 'NUMBER', description: 'Maximum price filter in INR' },
        min_rating: { type: 'NUMBER', description: 'Minimum average rating from 1 to 5' },
      },
    },
  },
  {
    name: 'get_shop_info',
    description: "Get a shop's detailed description, address, phone, working hours, cancellation policy, and list of active services with duration and price.",
    parameters: {
      type: 'OBJECT',
      properties: {
        shop_id: { type: 'STRING', description: 'UUID of the shop' },
      },
      required: ['shop_id'],
    },
  },
  {
    name: 'check_availability',
    description: 'Return truly available time slots for a specific service at a shop on a date. Source of truth for availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        shop_id: { type: 'STRING', description: 'UUID of the shop' },
        service_id: { type: 'STRING', description: 'UUID of the service' },
        date: { type: 'STRING', description: "YYYY-MM-DD in the shop's timezone" },
        time_window: { type: 'STRING', enum: ['any', 'morning', 'afternoon', 'evening'], description: 'Optional time filter' },
      },
      required: ['shop_id', 'service_id', 'date'],
    },
  },
  {
    name: 'prepare_booking',
    description: 'Validate a chosen slot and prepare a confirmation summary with a confirmation_token. Call this before asking the user to confirm.',
    parameters: {
      type: 'OBJECT',
      properties: {
        shop_id: { type: 'STRING', description: 'UUID of the shop' },
        service_id: { type: 'STRING', description: 'UUID of the service' },
        start_time: { type: 'STRING', description: 'ISO 8601 UTC start time from check_availability' },
        notes: { type: 'STRING', description: 'Optional customer notes' },
      },
      required: ['shop_id', 'service_id', 'start_time'],
    },
  },
  {
    name: 'create_booking',
    description: 'Create the booking after the user has explicitly confirmed. Requires the confirmation_token from prepare_booking.',
    parameters: {
      type: 'OBJECT',
      properties: {
        confirmation_token: { type: 'STRING', description: 'The token returned by prepare_booking' },
      },
      required: ['confirmation_token'],
    },
  },
  {
    name: 'list_my_bookings',
    description: "List the signed-in customer's bookings (upcoming or past).",
    parameters: {
      type: 'OBJECT',
      properties: {
        when: { type: 'STRING', enum: ['upcoming', 'past', 'all'], description: 'Filter by timeframe' },
      },
    },
  },
  {
    name: 'prepare_reschedule',
    description: 'Validate a new slot for an existing booking and prepare a confirmation token.',
    parameters: {
      type: 'OBJECT',
      properties: {
        booking_id: { type: 'STRING', description: 'UUID of the existing booking' },
        new_start_time: { type: 'STRING', description: 'ISO 8601 UTC new start time' },
      },
      required: ['booking_id', 'new_start_time'],
    },
  },
  {
    name: 'reschedule_booking',
    description: 'Execute rescheduling after the user explicitly confirmed. Requires confirmation_token from prepare_reschedule.',
    parameters: {
      type: 'OBJECT',
      properties: {
        confirmation_token: { type: 'STRING', description: 'Token from prepare_reschedule' },
      },
      required: ['confirmation_token'],
    },
  },
  {
    name: 'prepare_cancel',
    description: 'Check cancellation policy and prepare a confirmation token to cancel an appointment.',
    parameters: {
      type: 'OBJECT',
      properties: {
        booking_id: { type: 'STRING', description: 'UUID of the booking to cancel' },
        reason: { type: 'STRING', description: 'Reason for cancellation' },
      },
      required: ['booking_id'],
    },
  },
  {
    name: 'cancel_booking',
    description: 'Cancel the appointment after user confirmation. Requires confirmation_token from prepare_cancel.',
    parameters: {
      type: 'OBJECT',
      properties: {
        confirmation_token: { type: 'STRING', description: 'Token from prepare_cancel' },
      },
      required: ['confirmation_token'],
    },
  },
];

