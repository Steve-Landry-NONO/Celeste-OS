import { formatEuros } from "@celeste/domain";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, AppState, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { readMobileConfig } from "./src/config";
import { loadFinance, loadOrganizations, type FinanceSnapshot, type Organization } from "./src/data";
import { getSupabase } from "./src/supabase";
import { colors } from "./src/theme";

function Button({ label, onPress, disabled = false, secondary = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, (disabled || pressed) && styles.buttonDim]}><Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{label}</Text></Pressable>;
}

function ConfigurationMissing() {
  return <SafeAreaView style={styles.center}><View style={styles.card}><Text style={styles.eyebrow}>CONFIGURATION</Text><Text style={styles.title}>Connexion à préparer</Text><Text style={styles.body}>Renseignez l’URL Supabase et une clé publishable dans les variables Expo publiques. Aucune clé secrète ne doit entrer dans l’application.</Text></View></SafeAreaView>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (!email.trim() || !password) return setError("Saisissez votre email et votre mot de passe.");
    setBusy(true); setError(null);
    const result = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) setError("Connexion refusée. Vérifiez vos identifiants.");
  }
  return <SafeAreaView style={styles.center}><View style={styles.brand}><Text style={styles.eyebrow}>CELESTE OS · MOBILE</Text><Text style={styles.hero}>Piloter avec clarté, où que vous soyez.</Text></View><View style={styles.card} accessibilityLabel="Connexion CELESTE OS"><Text style={styles.title}>Se connecter</Text><TextInput accessibilityLabel="Adresse email" autoCapitalize="none" autoComplete="email" inputMode="email" onChangeText={setEmail} placeholder="vous@celeste.fr" style={styles.input} value={email}/><TextInput accessibilityLabel="Mot de passe" autoCapitalize="none" onChangeText={setPassword} onSubmitEditing={submit} placeholder="Mot de passe" secureTextEntry style={styles.input} value={password}/>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Button disabled={busy} label={busy ? "Connexion…" : "Se connecter"} onPress={submit}/></View></SafeAreaView>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.eyebrow}>{label}</Text><Text style={styles.amount}>{value}</Text></View>;
}

function Finance({ organization, onBack }: { organization: Organization; onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setBusy(true); setError(null); setSnapshot(null);
    try { setSnapshot(await loadFinance(getSupabase(), organization.id)); }
    catch (reason) { setError(reason instanceof Error && reason.name === "ForbiddenError" ? "Accès Finance réservé aux profils habilités." : "Finance indisponible. Vérifiez le réseau puis réessayez."); }
    finally { setBusy(false); }
  }, [organization.id]);
  useEffect(() => { void refresh(); }, [refresh]);
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh}/>}><Pressable accessibilityRole="button" accessibilityLabel="Retour aux espaces" onPress={onBack}><Text style={styles.back}>← Mes espaces</Text></Pressable><Text style={styles.eyebrow}>FINANCE · LECTURE SEULE</Text><Text style={styles.hero}>{organization.name}</Text>{error ? <View style={styles.notice}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Button label="Réessayer" onPress={refresh}/></View> : null}{!error && !snapshot && busy ? <ActivityIndicator color={colors.roseDark}/> : null}{snapshot ? <><View accessibilityLabel="Totaux financiers mobiles" style={styles.grid}><Metric label="COÛT NET" value={formatEuros(snapshot.costMinor)}/><Metric label="CAISSE" value={formatEuros(snapshot.cashMinor)}/><Metric label="CONTRIBUTIONS" value={formatEuros(snapshot.contributionMinor)}/><Metric label="RÉFÉRENCE" value={formatEuros(snapshot.referenceMinor)}/></View><View accessibilityLabel="Politique de remboursement mobile" style={[styles.card, styles.policy]}><Text style={styles.eyebrow}>REMBOURSEMENTS · POLITIQUE V{snapshot.reimbursementVersion}</Text><Text style={styles.title}>Régime désactivé</Text><Text style={styles.body}>Aucune demande, activation ou paiement n’est disponible. Les contributions existantes ne sont pas requalifiées.</Text></View><Text style={styles.sectionTitle}>Égalisation des fondateurs</Text>{snapshot.contributions.length ? snapshot.contributions.map(item => <View key={item.userId} style={styles.row}><View><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.small}>{item.active ? "Fondateur actif" : "Historique"}</Text></View><View style={styles.alignEnd}><Text style={styles.rowAmount}>{formatEuros(item.amountMinor)}</Text><Text style={styles.small}>{item.remainingMinor === null ? "Non éligible" : `Reste ${formatEuros(item.remainingMinor)}`}</Text></View></View>) : <Text style={styles.body}>Aucune contribution confirmée.</Text>}<View style={styles.notice}><Text style={styles.body}>Lecture calculée depuis les écritures autorisées. Aucun versement n’est recompté comme coût.</Text></View></> : null}</ScrollView></SafeAreaView>;
}

function Workspace() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setBusy(true); setError(null);
    try { setOrganizations(await loadOrganizations(getSupabase())); }
    catch { setError("Impossible de charger vos espaces. Vérifiez le réseau puis réessayez."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  if (selected) return <Finance organization={selected} onBack={() => setSelected(null)}/>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh}/>}><Text style={styles.eyebrow}>CELESTE OS · ESPACES</Text><Text style={styles.hero}>Bonjour, votre travail reste à portée de main.</Text><Text style={styles.body}>Choisissez un espace. Les accès sont relus dans la base à chaque consultation.</Text>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{!busy && !error && !organizations.length ? <View style={styles.notice}><Text style={styles.body}>Aucun espace actif n’est autorisé pour ce compte.</Text></View> : null}{organizations.map(item => <View key={item.id} style={styles.card}><Text style={styles.eyebrow}>{item.role.replaceAll("_", " ")}</Text><Text style={styles.title}>{item.name}</Text><Text style={styles.body}>{item.financeAllowed ? "Finance disponible en lecture sécurisée." : "Finance non autorisée pour ce profil."}</Text>{item.financeAllowed ? <Button label={`Ouvrir la finance de ${item.name}`} onPress={() => setSelected(item)}/> : null}</View>)}<Button label="Se déconnecter" onPress={() => void getSupabase().auth.signOut()} secondary/></ScrollView></SafeAreaView>;
}

function AppContent() {
  const configured = useMemo(() => Boolean(readMobileConfig()), []);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    if (!configured) return;
    const client = getSupabase();
    void client.auth.getSession().then(result => setSession(result.data.session));
    const auth = client.auth.onAuthStateChange((_event, next) => setSession(next));
    const appState = AppState.addEventListener("change", state => state === "active" ? client.auth.startAutoRefresh() : client.auth.stopAutoRefresh());
    return () => { auth.data.subscription.unsubscribe(); appState.remove(); };
  }, [configured]);
  if (!configured) return <><StatusBar style="dark"/><ConfigurationMissing/></>;
  if (session === undefined) return <SafeAreaView style={styles.center}><ActivityIndicator accessibilityLabel="Chargement de la session" color={colors.roseDark}/></SafeAreaView>;
  return <><StatusBar style="dark"/>{session ? <Workspace/> : <SignIn/>}</>;
}

export default function App() {
  return <SafeAreaProvider><AppContent/></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, center: { flex: 1, backgroundColor: colors.cream, justifyContent: "center", padding: 22, gap: 22 }, scroll: { padding: 22, gap: 16, paddingBottom: 48 }, brand: { gap: 8 }, hero: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: "700" }, eyebrow: { color: colors.roseDark, fontSize: 12, letterSpacing: 1.4, fontWeight: "700", textTransform: "uppercase" }, title: { color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: "700" }, sectionTitle: { color: colors.ink, fontSize: 20, marginTop: 8, fontWeight: "700" }, body: { color: colors.muted, fontSize: 16, lineHeight: 23 }, small: { color: colors.muted, fontSize: 13, marginTop: 3 }, back: { color: colors.roseDark, fontSize: 16, fontWeight: "700", paddingVertical: 4 }, card: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 22, padding: 20, gap: 13, shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } }, input: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 13, color: colors.ink, fontSize: 16, paddingHorizontal: 14, paddingVertical: 13 }, button: { backgroundColor: colors.roseDark, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, buttonSecondary: { backgroundColor: "transparent", borderColor: colors.roseDark, borderWidth: 1 }, buttonText: { color: colors.paper, fontSize: 16, fontWeight: "700" }, buttonSecondaryText: { color: colors.roseDark }, buttonDim: { opacity: 0.6 }, error: { color: colors.danger, fontSize: 15, lineHeight: 21 }, notice: { backgroundColor: colors.sage, borderRadius: 18, padding: 18, gap: 13 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { width: "48%", minWidth: 145, flexGrow: 1, backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 }, amount: { color: colors.ink, fontSize: 23, fontWeight: "800" }, policy: { borderColor: colors.rose }, row: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 }, rowTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" }, rowAmount: { color: colors.ink, fontSize: 17, fontWeight: "800" }, alignEnd: { alignItems: "flex-end" },
});
