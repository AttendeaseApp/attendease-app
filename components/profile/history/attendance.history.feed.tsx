import React, { useEffect, useState, useCallback, useMemo } from "react"
import {
     ActivityIndicator,
     View,
     FlatList,
     RefreshControl,
     StyleSheet,
     TouchableOpacity,
     Modal,
     ScrollView,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AttendanceHistoryCard from "@/components/cards/attendance.history.card"
import { ThemedText } from "@/components/ui/text/themed.text"
import { getAllAttendanceHistory } from "@/server/service/api/profile/attendance/attendance-history-service"
import { Ionicons } from "@expo/vector-icons"

export default function AttendanceHistories() {
     const [histories, setAttendanceHistories] = useState<any>(null)
     const [loading, setLoading] = useState(true)
     const [refreshing, setRefreshing] = useState(false)
     const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("All")
     const [selectedSemester, setSelectedSemester] = useState<string>("All")
     const [showFilterModal, setShowFilterModal] = useState(false)
     const insets = useSafeAreaInsets()

     useEffect(() => {
          getAllAttendanceHistory(setAttendanceHistories, setLoading)
     }, [])

     const onRefresh = useCallback(async () => {
          setRefreshing(true)
          await getAllAttendanceHistory(setAttendanceHistories, setLoading)
          setRefreshing(false)
     }, [])

     const { academicYears, semesters } = useMemo<{
          academicYears: string[]
          semesters: string[]
     }>(() => {
          if (!histories || histories.length === 0) {
               return { academicYears: [], semesters: [] }
          }

          const uniqueYears = Array.from(
               new Set(histories.map((h: any) => h.academicYearName).filter(Boolean))
          ).sort() as string[]

          const uniqueSemesters = Array.from(
               new Set(histories.map((h: any) => h.semesterName).filter(Boolean))
          ).sort() as string[]

          return {
               academicYears: uniqueYears,
               semesters: uniqueSemesters,
          }
     }, [histories])

     const filteredHistories = useMemo(() => {
          if (!histories) return null

          return histories.filter((item: any) => {
               const matchesYear =
                    selectedAcademicYear === "All" || item.academicYearName === selectedAcademicYear
               const matchesSemester =
                    selectedSemester === "All" || item.semesterName === selectedSemester
               return matchesYear && matchesSemester
          })
     }, [histories, selectedAcademicYear, selectedSemester])

     const clearFilters = () => {
          setSelectedAcademicYear("All")
          setSelectedSemester("All")
     }

     const hasActiveFilters = selectedAcademicYear !== "All" || selectedSemester !== "All"

     if (loading) {
          return (
               <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#27548A" />
                    <ThemedText type="default" style={styles.loadingText}>
                         Loading attendance history...
                    </ThemedText>
               </View>
          )
     }

     if (!histories) {
          return (
               <View style={styles.centerContainer}>
                    <View style={styles.errorIconContainer}>
                         <Ionicons name="alert-circle-outline" size={64} color="#772F1A" />
                    </View>
                    <ThemedText type="default" style={styles.errorTitle}>
                         UNABLE TO LOAD HISTORIES
                    </ThemedText>
                    <ThemedText type="default" style={styles.errorDescription}>
                         There was a problem loading your attendance records. Please try again.
                    </ThemedText>
               </View>
          )
     }

     const renderEmptyState = () => (
          <View style={styles.emptyContainer}>
               <View style={styles.emptyIconContainer}>
                    <Ionicons name="checkmark-outline" size={64} color="#676F54" />
               </View>
               <ThemedText type="default" style={styles.emptyTitle}>
                    {hasActiveFilters ? "NO RECORDS FOUND" : "NO ATTENDANCE RECORDS FOUND"}
               </ThemedText>
               <ThemedText type="default" style={styles.emptyDescription}>
                    {hasActiveFilters
                         ? "No attendance records match your current filters. Try adjusting your filters."
                         : "Your attendance history will appear here once you start attending events."}
               </ThemedText>
               {hasActiveFilters && (
                    <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                         <ThemedText type="default" style={styles.clearButtonText}>
                              Clear Filters
                         </ThemedText>
                    </TouchableOpacity>
               )}
          </View>
     )

     const renderHeader = () => (
          <View style={styles.headerContainer}>
               <View style={styles.headerTop}>
                    <ThemedText type="subtitle" style={styles.headerTitle}>
                         Attendance Histories
                    </ThemedText>
                    <TouchableOpacity
                         style={styles.filterButton}
                         onPress={() => setShowFilterModal(true)}
                    >
                         <Ionicons name="filter" size={20} color="#4F46E5" />
                         {hasActiveFilters && <View style={styles.filterDot} />}
                    </TouchableOpacity>
               </View>
               <View style={styles.headerBottom}>
                    <View style={styles.countBadge}>
                         <ThemedText type="subtitle" style={styles.countText}>
                              {filteredHistories?.length || 0} record/s
                         </ThemedText>
                    </View>
                    {hasActiveFilters && (
                         <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersChip}>
                              <ThemedText style={styles.clearFiltersText}>Clear filters</ThemedText>
                              <Ionicons name="close-circle" size={16} color="#6B7280" />
                         </TouchableOpacity>
                    )}
               </View>
          </View>
     )

     const renderFilterModal = () => (
          <Modal
               visible={showFilterModal}
               transparent
               animationType="slide"
               onRequestClose={() => setShowFilterModal(false)}
          >
               <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                         <View style={styles.modalHeader}>
                              <ThemedText type="subtitle" style={styles.modalTitle}>
                                   Filter Attendance
                              </ThemedText>
                              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                   <Ionicons name="close" size={24} color="#374151" />
                              </TouchableOpacity>
                         </View>

                         <ScrollView style={styles.modalBody}>
                              {/* Academic Year Filter */}
                              <View style={styles.filterSection}>
                                   <ThemedText type="default" style={styles.filterLabel}>
                                        Academic Year
                                   </ThemedText>
                                   <TouchableOpacity
                                        style={[
                                             styles.filterOption,
                                             selectedAcademicYear === "All" &&
                                                  styles.filterOptionActive,
                                        ]}
                                        onPress={() => setSelectedAcademicYear("All")}
                                   >
                                        <ThemedText
                                             style={[
                                                  styles.filterOptionText,
                                                  selectedAcademicYear === "All" &&
                                                       styles.filterOptionTextActive,
                                             ]}
                                        >
                                             All Years
                                        </ThemedText>
                                        {selectedAcademicYear === "All" && (
                                             <Ionicons name="checkmark" size={20} color="#4F46E5" />
                                        )}
                                   </TouchableOpacity>
                                   {academicYears.map((year: string) => (
                                        <TouchableOpacity
                                             key={year}
                                             style={[
                                                  styles.filterOption,
                                                  selectedAcademicYear === year &&
                                                       styles.filterOptionActive,
                                             ]}
                                             onPress={() => setSelectedAcademicYear(year)}
                                        >
                                             <ThemedText
                                                  style={[
                                                       styles.filterOptionText,
                                                       selectedAcademicYear === year &&
                                                            styles.filterOptionTextActive,
                                                  ]}
                                             >
                                                  {year}
                                             </ThemedText>
                                             {selectedAcademicYear === year && (
                                                  <Ionicons
                                                       name="checkmark"
                                                       size={20}
                                                       color="#4F46E5"
                                                  />
                                             )}
                                        </TouchableOpacity>
                                   ))}
                              </View>

                              {/* Semester Filter */}
                              <View style={styles.filterSection}>
                                   <ThemedText type="default" style={styles.filterLabel}>
                                        Semester
                                   </ThemedText>
                                   <TouchableOpacity
                                        style={[
                                             styles.filterOption,
                                             selectedSemester === "All" &&
                                                  styles.filterOptionActive,
                                        ]}
                                        onPress={() => setSelectedSemester("All")}
                                   >
                                        <ThemedText
                                             style={[
                                                  styles.filterOptionText,
                                                  selectedSemester === "All" &&
                                                       styles.filterOptionTextActive,
                                             ]}
                                        >
                                             All Semesters
                                        </ThemedText>
                                        {selectedSemester === "All" && (
                                             <Ionicons name="checkmark" size={20} color="#4F46E5" />
                                        )}
                                   </TouchableOpacity>
                                   {semesters.map((semester: string) => (
                                        <TouchableOpacity
                                             key={semester}
                                             style={[
                                                  styles.filterOption,
                                                  selectedSemester === semester &&
                                                       styles.filterOptionActive,
                                             ]}
                                             onPress={() => setSelectedSemester(semester)}
                                        >
                                             <ThemedText
                                                  style={[
                                                       styles.filterOptionText,
                                                       selectedSemester === semester &&
                                                            styles.filterOptionTextActive,
                                                  ]}
                                             >
                                                  {semester}
                                             </ThemedText>
                                             {selectedSemester === semester && (
                                                  <Ionicons
                                                       name="checkmark"
                                                       size={20}
                                                       color="#4F46E5"
                                                  />
                                             )}
                                        </TouchableOpacity>
                                   ))}
                              </View>
                         </ScrollView>

                         <View style={styles.modalFooter}>
                              <TouchableOpacity
                                   style={styles.applyButton}
                                   onPress={() => setShowFilterModal(false)}
                              >
                                   <ThemedText style={styles.applyButtonText}>
                                        Apply Filters
                                   </ThemedText>
                              </TouchableOpacity>
                         </View>
                    </View>
               </View>
          </Modal>
     )

     return (
          <View style={styles.container}>
               {filteredHistories && filteredHistories.length === 0 ? (
                    renderEmptyState()
               ) : (
                    <FlatList
                         data={filteredHistories}
                         keyExtractor={(item, index) => item.eventId || `event-${index}`}
                         renderItem={({ item }) => (
                              <AttendanceHistoryCard
                                   eventId={item.eventId}
                                   eventName={item.eventName}
                                   academicYearName={item.academicYearName}
                                   semesterName={item.semesterName}
                                   timeIn={item.timeIn}
                                   timeOut={item.timeOut}
                                   attendanceStatus={item.attendanceStatus}
                                   reason={item.reason}
                              />
                         )}
                         ListHeaderComponent={renderHeader}
                         showsVerticalScrollIndicator={false}
                         contentContainerStyle={[
                              styles.listContent,
                              { paddingBottom: insets.bottom + 80 },
                         ]}
                         refreshControl={
                              <RefreshControl
                                   refreshing={refreshing}
                                   onRefresh={onRefresh}
                                   colors={["#27548A"]}
                                   tintColor="#27548A"
                              />
                         }
                    />
               )}
               {renderFilterModal()}
          </View>
     )
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
     },
     centerContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
     },
     loadingText: {
          marginTop: 12,
          opacity: 0.6,
     },
     errorIconContainer: {
          marginBottom: 16,
     },
     errorTitle: {
          fontSize: 20,
          marginBottom: 8,
          textAlign: "center",
     },
     errorDescription: {
          fontSize: 14,
          opacity: 0.6,
          textAlign: "center",
          lineHeight: 20,
     },
     emptyContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
          paddingVertical: 60,
     },
     emptyIconContainer: {
          width: 120,
          height: 120,
          justifyContent: "center",
          alignItems: "center",
     },
     emptyTitle: {
          fontSize: 25,
          marginBottom: 8,
          textAlign: "center",
     },
     emptyDescription: {
          fontSize: 14,
          opacity: 0.6,
          textAlign: "center",
          lineHeight: 20,
     },
     clearButton: {
          marginTop: 16,
          paddingHorizontal: 24,
          paddingVertical: 12,
          backgroundColor: "#4F46E5",
          borderRadius: 8,
     },
     clearButtonText: {
          color: "#FFFFFF",
          fontWeight: "600",
     },
     listContent: {
          paddingTop: 0,
     },
     headerContainer: {
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 12,
     },
     headerTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
     },
     headerTitle: {
          fontSize: 18,
     },
     filterButton: {
          padding: 8,
          position: "relative",
     },
     filterDot: {
          position: "absolute",
          top: 6,
          right: 6,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#EF4444",
     },
     headerBottom: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
     },
     countBadge: {
          paddingVertical: 4,
     },
     countText: {
          fontSize: 14,
          color: "#4F46E5",
     },
     clearFiltersChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: "#F3F4F6",
          borderRadius: 16,
     },
     clearFiltersText: {
          fontSize: 12,
          color: "#6B7280",
     },
     modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
     },
     modalContent: {
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "80%",
     },
     modalHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
     },
     modalTitle: {
          fontSize: 18,
          fontWeight: "600",
     },
     modalBody: {
          padding: 20,
     },
     filterSection: {
          marginBottom: 24,
     },
     filterLabel: {
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 12,
     },
     filterOption: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          marginBottom: 8,
     },
     filterOptionActive: {
          backgroundColor: "#EEF2FF",
          borderColor: "#4F46E5",
     },
     filterOptionText: {
          fontSize: 14,
          color: "#374151",
     },
     filterOptionTextActive: {
          color: "#4F46E5",
          fontWeight: "600",
     },
     modalFooter: {
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
     },
     applyButton: {
          backgroundColor: "#4F46E5",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
     },
     applyButtonText: {
          color: "#FFFFFF",
          fontSize: 16,
          fontWeight: "600",
     },
})
