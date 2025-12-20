import { EventStatus } from "@/domain/enums/event/status/event.status.enum";
import { EligibilityCriteria } from "../eligibility/event.eligibility";
import { EventLocation } from "../../location/registration/registration.location";

export interface Event {
    eventId: string;
    eventName: string;
    eventStatus: EventStatus;
    description?: string;
    timeInRegistrationStartDateTime?: string;
    startDateTime?: string;
    endDateTime?: string;
    eventLocation?: EventLocation;
    locationId?: string;
    eligibleStudents?: EligibilityCriteria;
    facialVerificationEnabled?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
