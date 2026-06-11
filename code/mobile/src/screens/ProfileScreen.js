import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { svc, tokenStore } from "../api";
import { C, R, shadow } from "../theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [me, setMe] = useState(null);
  useFocusEffect(useCallback(() => { svc.profile().then(setMe); }, []));

  const logout = async () => { await tokenStore.clear(); navigation.getParent()?.reset({ index: 0, routes: [{ name: "Login" }] }); };
  const initials = me?.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "—";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
      <View style={[s.head, shadow]}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
        <Text style={s.name}>{me?.fullName || "—"}</Text>
        <Text style={s.role}>{me?.designation}</Text>
      </View>
      <View style={[s.card, shadow]}>
        <Row l="CNIC" v={me?.cnic} />
        <Row l="Employment type" v={me?.employmentType} />
        <Row l="Email (sign in)" v={me?.email} />
        <Row l="Phone" v={me?.phone} />
      </View>
      <TouchableOpacity style={s.logout} onPress={logout} activeOpacity={0.85}>
        <Text style={s.logoutTxt}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ l, v }) {
  return (
    <View style={s.row}>
      <Text style={s.rowL}>{l}</Text>
      <Text style={s.rowV}>{v || "—"}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { backgroundColor: C.card, borderRadius: R.card, padding: 24, alignItems: "center" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 26, fontWeight: "800", color: "#04201C" },
  name: { fontSize: 20, fontWeight: "800", color: C.ink, marginTop: 12 },
  role: { fontSize: 13.5, color: C.muted, marginTop: 3 },
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 20, marginTop: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  rowL: { fontSize: 13.5, color: C.muted },
  rowV: { fontSize: 14.5, fontWeight: "700", color: C.ink },
  logout: { marginTop: 20, height: 50, borderRadius: R.btn, borderWidth: 1.5, borderColor: C.danger, alignItems: "center", justifyContent: "center" },
  logoutTxt: { color: C.danger, fontWeight: "800", fontSize: 15 },
});
