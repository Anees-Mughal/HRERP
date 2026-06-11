import React, { useEffect, useState } from "react";
import { Text, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tokenStore } from "../api";
import { C } from "../theme";

import HomeScreen from "../screens/HomeScreen";
import StaffScreen from "../screens/StaffScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import ApprovalsScreen from "../screens/ApprovalsScreen";
import RequestsScreen from "../screens/RequestsScreen";
import PayslipScreen from "../screens/PayslipScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const icon = (glyph) => ({ color }) => <Text style={{ fontSize: 19, color }}>{glyph}</Text>;

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState(null);

  useEffect(() => {
    tokenStore.getUser().then((u) => setRole(u?.role || "Staff"));
  }, []);

  if (!role) return null;
  const isHead = role === "Head";
  const barHeight = 58 + Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.card, borderTopColor: C.line,
          height: barHeight, paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon("▦") }} />
      {isHead ? (
        <>
          <Tab.Screen name="Staff" component={StaffScreen} options={{ tabBarIcon: icon("◉") }} />
          <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarIcon: icon("✓") }} />
          <Tab.Screen name="Approvals" component={ApprovalsScreen} options={{ tabBarIcon: icon("✔") }} />
          <Tab.Screen name="Payroll" component={PayslipScreen} options={{ tabBarIcon: icon("₨") }} />
        </>
      ) : (
        <>
          <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarIcon: icon("✓") }} />
          <Tab.Screen name="Requests" component={RequestsScreen} options={{ tabBarIcon: icon("✈") }} />
          <Tab.Screen name="Payslip" component={PayslipScreen} options={{ tabBarIcon: icon("₨") }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon("☰") }} />
        </>
      )}
    </Tab.Navigator>
  );
}
