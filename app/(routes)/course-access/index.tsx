import CourseAccessScreen from "@/screens/courses/course.access.screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function index() {
  return (
    <GestureHandlerRootView>
      <CourseAccessScreen />
    </GestureHandlerRootView>
  );
}
