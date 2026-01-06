import { LocationPurpose } from "@/domain/enums/location/lcoation.purpose.enum";
import { LocationEnvironment } from "@/domain/enums/location/location.environment.enum";

export interface Location {
    locationId: string;
    locationName: string;
    description?: string;
    environment: LocationEnvironment;
    purpose: LocationPurpose;
    locationGeometry?: any;
    createdAt?: string;
    updatedAt?: string;
}
