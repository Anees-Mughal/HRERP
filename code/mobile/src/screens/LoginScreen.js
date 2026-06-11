import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { svc, tokenStore } from "../api";
import { C, R, shadow } from "../theme";

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!identifier.trim() || !password) {
      setError("Enter your mobile number (head) or email (staff), and password.");
      return;
    }
    setBusy(true);
    try {
      const data = await svc.login(identifier.trim(), password);
      await tokenStore.set(data);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (e) {
      setError(
        e.status === 401 || e.response?.status === 401
          ? "Credentials incorrect. Head signs in with mobile number, staff with email."
          : "Couldn't sign in. Check your connection."
      );
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[s.hero, { paddingTop: insets.top + 40 }]}>
        <View style={s.mark}><Text style={s.markTxt}>H</Text></View>
        <Text style={s.brand}>HRstackPK</Text>
        <Text style={s.tag}>Head signs in with mobile number.{"\n"}Staff sign in with email.</Text>
      </View>

      <View style={[s.card, shadow, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}>
        <Text style={s.h1}>Sign in</Text>
        {!!error && <View style={s.errBox}><Text style={s.errTxt}>{error}</Text></View>}

        <Text style={s.lbl}>Mobile number or email</Text>
        <TextInput style={s.input} value={identifier} onChangeText={setIdentifier}
          placeholder="0300-1234567 or you@school.pk" placeholderTextColor={C.muted}
          autoCapitalize="none" keyboardType="email-address" editable={!busy} />

        <Text style={s.lbl}>Password</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          placeholder="••••••••" placeholderTextColor={C.muted}
          secureTextEntry editable={!busy} onSubmitEditing={submit} />

        <TouchableOpacity style={s.btn} onPress={submit} disabled={busy} activeOpacity={0.85}>
          {busy ? <ActivityIndicator color="#04201C" /> : <Text style={s.btnTxt}>Sign in</Text>}
        </TouchableOpacity>

        <Text style={s.hint}>
          Demo — head: 0300-1234567 · staff: ahmed@acme.pk (any password){"\n"}
          New company? Sign up on the web at hrstackpk.com
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy, justifyContent: "space-between" },
  hero: { padding: 28 },
  mark: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  markTxt: { fontWeight: "800", fontSize: 20, color: C.navy },
  brand: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 14, letterSpacing: -0.5 },
  tag: { color: "rgba(255,255,255,0.6)", fontSize: 14.5, marginTop: 6, lineHeight: 21 },
  card: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26 },
  h1: { fontSize: 22, fontWeight: "800", color: C.ink, marginBottom: 16, letterSpacing: -0.4 },
  lbl: { fontSize: 12.5, fontWeight: "700", color: C.ink, marginBottom: 6, marginTop: 10 },
  input: { height: 50, borderWidth: 1.5, borderColor: C.line, borderRadius: R.btn, paddingHorizontal: 14, fontSize: 15.5, color: C.ink, backgroundColor: "#fff" },
  btn: { height: 52, borderRadius: R.btn, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginTop: 22 },
  btnTxt: { fontWeight: "800", fontSize: 16, color: "#04201C" },
  errBox: { backgroundColor: C.dangerSoft, borderRadius: 10, padding: 12, marginBottom: 8 },
  errTxt: { color: C.danger, fontSize: 13.5 },
  hint: { textAlign: "center", color: C.muted, fontSize: 12.5, marginTop: 16, lineHeight: 19 },
});
