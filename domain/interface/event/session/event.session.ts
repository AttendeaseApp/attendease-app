import { EventStatus } from "@/domain/enums/event/status/event.status.enum";
import { EligibilityCriteria } from "../eligibility/event.eligibility";
import { Location } from "../../location/location-interface";

export interface Event {
    eventId: string;
    eventName: string;

    registrationLocation?: Location;
    registrationLocationId: string;
    registrationLocationName: string;

    venueLocation?: Location;
    venueLocationId: string;
    venueLocationName: string;

    description?: string;
    eligibleStudents?: EligibilityCriteria;

    registrationDateTime?: string;
    startingDateTime?: string;
    endingDateTime?: string;

    eventStatus: EventStatus;

    facialVerificationEnabled?: boolean;
    attendanceLocationMonitoringEnabled?: boolean;

    academicYear?: string;
    academicYearId?: string;
    academicYearName?: string;
    semester?: number;
    semesterName?: string;

    createdBy?: string;
    created?: string;
    lastModified?: string;
}
