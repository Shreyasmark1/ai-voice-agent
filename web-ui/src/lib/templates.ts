import type {
  ConditionOperator,
  WorkflowCondition,
  WorkflowFieldType,
} from "@/db/schema";
import type { Industry } from "@/lib/constants";

type TemplateField = {
  key: string;
  label: string;
  type: WorkflowFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
};

export type WorkflowTemplate = {
  id: string;
  industry: Industry;
  name: string;
  description: string;
  language: "english" | "hindi";
  greeting: string;
  closingMessage: string;
  fields: TemplateField[];
  conditions: WorkflowCondition[];
};

function condition(
  fieldKey: string,
  operator: ConditionOperator,
  value: string
): WorkflowCondition {
  return {
    id: crypto.randomUUID(),
    fieldKey,
    operator,
    value,
    urgency: "urgent",
  };
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "cake_shop",
    industry: "Cake Shop",
    name: "Missed call - Cake order",
    description:
      "Collects cake order details over a missed call: type, flavour, weight, date, message, delivery/pickup and budget. Flags orders needed within 24 hours as urgent.",
    language: "english",
    greeting:
      "Hi, thanks for calling! This is the cake shop's virtual assistant. Did you want to order a cake today, or is this a general enquiry?",
    closingMessage:
      "Perfect, your order enquiry is saved. We'll call you back shortly to confirm the details. Thanks for calling!",
    fields: [
      {
        key: "full_name",
        label: "What name should we put on the order?",
        type: "text",
        required: true,
        placeholder: "e.g. Priya Sharma",
      },
      {
        key: "phone",
        label: "What is your phone number?",
        type: "phone",
        required: true,
        placeholder: "e.g. 98765 43210",
      },
      {
        key: "order_type",
        label: "Did you call to order a cake or is it a general enquiry?",
        type: "choice",
        required: true,
        options: ["Order a cake", "General enquiry"],
      },
      {
        key: "cake_type",
        label: "What type of cake are you looking for?",
        type: "choice",
        required: false,
        options: ["Chocolate", "Vanilla", "Red velvet", "Black forest", "Custom design"],
      },
      {
        key: "flavour",
        label: "Which flavour do you prefer?",
        type: "choice",
        required: false,
        options: ["Chocolate", "Vanilla", "Strawberry", "Butterscotch", "Blueberry"],
      },
      {
        key: "weight",
        label: "What weight of cake do you need?",
        type: "choice",
        required: false,
        options: ["0.5 kg", "1 kg", "1.5 kg", "2 kg", "3 kg"],
      },
      {
        key: "required_date",
        label: "When do you need the cake?",
        type: "date",
        required: true,
      },
      {
        key: "custom_message",
        label: "Any message to write on the cake?",
        type: "textarea",
        required: false,
        placeholder: "e.g. Happy Birthday Riya!",
      },
      {
        key: "delivery_or_pickup",
        label: "Would you like delivery or pickup?",
        type: "choice",
        required: true,
        options: ["Delivery", "Pickup"],
      },
      {
        key: "budget",
        label: "What is your approximate budget?",
        type: "text",
        required: false,
        placeholder: "e.g. around 1500",
      },
    ],
    conditions: [{ ...condition("required_date", "within_days", "1") }],
  },
  {
    id: "delivery_logistics",
    industry: "Delivery / Logistics",
    name: "Missed call - Delivery request",
    description:
      "Handles new delivery requests, status updates, and help with existing deliveries over a missed call.",
    language: "english",
    greeting:
      "Hello, thanks for calling! This is the delivery service assistant. Are you looking for a new delivery, a status update, or help with an existing delivery?",
    closingMessage:
      "Got it, your delivery request has been noted. Our team will confirm pickup and drop-off details shortly. Thanks for calling!",
    fields: [
      {
        key: "full_name",
        label: "What is your name?",
        type: "text",
        required: true,
        placeholder: "e.g. Rahul Verma",
      },
      {
        key: "phone",
        label: "What is your phone number?",
        type: "phone",
        required: true,
      },
      {
        key: "request_type",
        label: "Are you requesting a new delivery, a status update, or help with an existing delivery?",
        type: "choice",
        required: true,
        options: ["New delivery", "Status update", "Existing delivery help"],
      },
      {
        key: "tracking_number",
        label: "Please share your order or tracking number.",
        type: "text",
        required: false,
        placeholder: "e.g. DLX-10294",
      },
      {
        key: "pickup_location",
        label: "Where should the package be picked up from?",
        type: "textarea",
        required: false,
      },
      {
        key: "delivery_location",
        label: "Where should the package be delivered?",
        type: "textarea",
        required: false,
      },
      {
        key: "package_type",
        label: "What is being delivered?",
        type: "choice",
        required: false,
        options: ["Document", "Parcel", "Food", "Fragile item"],
      },
      {
        key: "preferred_time",
        label: "What time would you prefer for pickup/delivery?",
        type: "text",
        required: false,
        placeholder: "e.g. tomorrow 4 PM",
      },
    ],
    conditions: [],
  },
  {
    id: "clinic",
    industry: "Clinic / Doctor",
    name: "Missed call - Appointment request",
    description:
      "Collects patient details to book, reschedule, or cancel an appointment. The assistant never gives medical advice.",
    language: "english",
    greeting:
      "Hello, thanks for calling the clinic! Are you calling to book, reschedule, or cancel an appointment, or just to enquire?",
    closingMessage:
      "Thank you, your appointment request has been noted. Our front desk will confirm your slot shortly. Please note, I'm an assistant and cannot provide medical advice.",
    fields: [
      {
        key: "patient_name",
        label: "What is the patient's full name?",
        type: "text",
        required: true,
        placeholder: "e.g. Ananya Iyer",
      },
      {
        key: "phone",
        label: "What is the best contact number?",
        type: "phone",
        required: true,
      },
      {
        key: "appointment_type",
        label: "What would you like to do?",
        type: "choice",
        required: true,
        options: ["Book appointment", "Reschedule appointment", "Cancel appointment", "General enquiry"],
      },
      {
        key: "preferred_doctor",
        label: "Do you have a preferred doctor?",
        type: "text",
        required: false,
        placeholder: "e.g. Dr. Mehta, or no preference",
      },
      {
        key: "speciality",
        label: "Which department do you need?",
        type: "choice",
        required: false,
        options: ["General", "Dental", "Eye", "Skin", "Gynaecology"],
      },
      {
        key: "preferred_date",
        label: "What date would you prefer?",
        type: "date",
        required: true,
      },
      {
        key: "preferred_time",
        label: "What time works best?",
        type: "time",
        required: false,
      },
    ],
    conditions: [],
  },
  {
    id: "real_estate",
    industry: "Real Estate",
    name: "Missed call - Property lead",
    description:
      "Qualifies a lead over a missed call: buying, renting, selling, or scheduling a site visit.",
    language: "english",
    greeting:
      "Hi, thanks for calling! This is the property assistant. Are you looking to buy, rent, sell, or schedule a site visit?",
    closingMessage:
      "Great, your details are saved and a property consultant will reach out to you shortly. Thanks for calling!",
    fields: [
      {
        key: "full_name",
        label: "What is your name?",
        type: "text",
        required: true,
      },
      {
        key: "phone",
        label: "What is your contact number?",
        type: "phone",
        required: true,
      },
      {
        key: "interest",
        label: "Are you looking to buy, rent, sell, or schedule a site visit?",
        type: "choice",
        required: true,
        options: ["Buy", "Rent", "Sell", "Schedule a site visit"],
      },
      {
        key: "property_type",
        label: "What type of property are you interested in?",
        type: "choice",
        required: false,
        options: ["Apartment", "Villa", "Plot", "Commercial", "Office space"],
      },
      {
        key: "preferred_location",
        label: "Which location do you prefer?",
        type: "text",
        required: false,
        placeholder: "e.g. HSR Layout, Bangalore",
      },
      {
        key: "budget",
        label: "What is your budget range?",
        type: "text",
        required: false,
        placeholder: "e.g. 50-80 lakhs",
      },
      {
        key: "timeline",
        label: "When are you planning to move or start?",
        type: "choice",
        required: false,
        options: ["ASAP", "Within 3 months", "6 months or more"],
      },
      {
        key: "visit_preference",
        label: "Would you like to schedule a site visit?",
        type: "choice",
        required: false,
        options: ["Yes", "No, not yet"],
      },
    ],
    conditions: [{ ...condition("interest", "eq", "Schedule a site visit") }],
  },
  {
    id: "home_repair",
    industry: "Home / Repair Service",
    name: "Missed call - Service request",
    description:
      "Collects repair/service details over a missed call and flags urgent requests for priority follow-up.",
    language: "english",
    greeting:
      "Hi, thanks for calling! This is the repair service assistant. Please tell me what service you need, and I'll take down the details.",
    closingMessage:
      "Thanks, your service request has been recorded. We'll get back to you shortly, sooner if it's urgent. Thanks for calling!",
    fields: [
      {
        key: "full_name",
        label: "What is your name?",
        type: "text",
        required: true,
      },
      {
        key: "phone",
        label: "What is your contact number?",
        type: "phone",
        required: true,
      },
      {
        key: "service_type",
        label: "What service do you need?",
        type: "choice",
        required: true,
        options: ["Plumbing", "Electrical", "AC repair", "Appliance repair", "Carpentry", "Other"],
      },
      {
        key: "issue_description",
        label: "Please describe the issue.",
        type: "textarea",
        required: true,
        placeholder: "e.g. Water leaking under the kitchen sink",
      },
      {
        key: "urgency",
        label: "How urgent is this?",
        type: "choice",
        required: true,
        options: ["Very urgent", "Normal"],
      },
      {
        key: "address",
        label: "What is the service address?",
        type: "textarea",
        required: true,
      },
      {
        key: "preferred_visit_time",
        label: "When is the best time for a visit?",
        type: "text",
        required: false,
        placeholder: "e.g. tomorrow morning",
      },
    ],
    conditions: [{ ...condition("urgency", "eq", "Very urgent") }],
  },
];

export function getTemplate(id: string) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}