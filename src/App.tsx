import React, { useState, useRef } from 'react';
import { 
  Shield, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  Lock,
  Search,
  BarChart3,
  Scale,
  Code2,
  Download,
  Globe,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- Global Types ---
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// --- Types ---
interface CriticalIssue {
  clause: string;
  issue: string;
  risk_level: 'High' | 'Medium' | 'Low';
  suggested_fix: string;
}

interface ComplianceCheck {
  regulation: string;
  status: 'Compliant' | 'Non-Compliant';
  notes: string;
}

interface AnalysisResult {
  document_type: string;
  risk_score: number;
  summary: string;
  critical_issues: CriticalIssue[];
  compliance_check: ComplianceCheck[];
}

// --- Gemini Config ---
const getSystemInstruction = (lang: string) => `Agisci come un esperto legale e revisore di smart contract per il mercato svizzero. Analizza il documento fornito per: 1. Conformità alla Legge Federale sulla protezione dei dati (LPD) e FINMA. 2. Clausole sbilanciate o rischiose. 3. Vulnerabilità di sicurezza (se è codice Solidity). 
IMPORTANTE: Devi rispondere ESCLUSIVAMENTE nella lingua: ${lang}.
Devi rispondere ESCLUSIVAMENTE con un oggetto JSON valido con questa struttura:
{
  "document_type": "string",
  "risk_score": 0-100,
  "summary": "string",
  "critical_issues": [{"clause": "string", "issue": "string", "risk_level": "High/Medium/Low", "suggested_fix": "string"}],
  "compliance_check": [{"regulation": "string", "status": "Compliant/Non-Compliant", "notes": "string"}]
}`;

// --- Translations ---
const translations = {
  IT: {
    title: "SwissGuard AI",
    subtitle: "Revisore di Conformità e Rischio",
    documentation: "Documentazione",
    finma: "Linee Guida FINMA",
    downloadReport: "Scarica Report",
    heroTitle: "Revisione della Conformità",
    heroSubtitle: "di Grado Istituzionale.",
    heroDesc: "Valutazione automatizzata del rischio per il mercato finanziario svizzero. Verifica l'allineamento normativo LPD (Swiss DPA), GDPR e FINMA in pochi secondi.",
    standardModel: "Standard (Gratuito)",
    advancedModel: "Avanzato (Pagamento)",
    apiKeyRequired: "Chiave API Richiesta",
    apiKeyDesc: "Per utilizzare il modello di auditing avanzato, è necessario selezionare una chiave API da un progetto Google Cloud a pagamento.",
    selectKey: "Seleziona Chiave API",
    learnBilling: "Scopri di più sulla fatturazione",
    uploadDoc: "Carica Documento",
    dropFiles: "Rilascia PDF o contratto Solidity qui",
    runAudit: "Esegui Audit",
    analyzing: "Analisi Conformità...",
    awaitingDoc: "In attesa del documento",
    awaitingDesc: "Carica un documento legale o uno smart contract per generare un rapporto completo su rischi e conformità.",
    auditing: "Revisione del documento...",
    auditingDesc: "La nostra IA sta verificando le clausole con le ultime circolari FINMA e la Legge federale sulla protezione dei dati.",
    riskScore: "Punteggio di Rischio",
    verified: "Verificato",
    docType: "Tipo di Documento",
    complianceCheck: "Controllo di Conformità Normativa",
    criticalIssues: "Criticità e Risultati",
    issue: "Problema",
    suggestedFix: "Soluzione Suggerita",
    privacyPolicy: "Informativa sulla Privacy",
    termsOfService: "Termini di Servizio",
    location: "Zurigo, CH",
    techDoc: "Documentazione Tecnica",
    finmaFramework: "Quadro Normativo FINMA",
    compliant: "Conforme",
    nonCompliant: "Non Conforme",
    swissDataResidency: "Residenza Dati Svizzera",
    finmaCompliant: "Conforme FINMA",
    pdfReportTitle: "RAPPORTO DI AUDIT DI CONFORMITÀ E RISCHIO",
    pdfExecutiveSummary: "Sintesi Esecutiva",
    pdfCriticalFindings: "Criticità e Risultati",
    pdfIssueLabel: "Problema",
    pdfFixLabel: "Soluzione Suggerita",
    pdfGeneratedBy: "Generato da SwissGuard AI - Pagina",
    pdfOf: "di",
    pdfDate: "Data",
    riskHigh: "Alto",
    riskMedium: "Medio",
    riskLow: "Basso",
    docDesc1: "SwissGuard AI utilizza modelli LLM avanzati specificamente sintonizzati per il panorama legale e finanziario svizzero. Il nostro motore di analisi si concentra su tre pilastri principali:",
    docPillar1: "Protezione dei Dati: Verifica rispetto alla LPD (Legge federale sulla protezione dei dati) e al GDPR.",
    docPillar2: "Allineamento Normativo: Controllo della conformità alle circolari e alle linee guida FINMA.",
    docPillar3: "Mitigazione del Rischio: Identificazione di clausole sbilanciate e potenziali vulnerabilità di sicurezza negli smart contract.",
    finmaDesc1: "L'Autorità federale di vigilanza sui mercati finanziari (FINMA) stabilisce standard rigorosi per il rischio operativo e l'esternalizzazione. SwissGuard aiuta le istituzioni a navigare:",
    finmaPoint1: "Circolare 2018/3: Outsourcing – banche e assicuratori.",
    finmaPoint2: "Circolare 2023/1: Rischi operativi e resilienza.",
    finmaPoint3: "Antiriciclaggio: Controlli di base per la conformità LRD nelle strutture contrattuali.",
    finmaLink: "Visita le Circolari Ufficiali FINMA",
    privacyTitle: "Informativa sulla Privacy",
    privacyDesc: "La protezione dei vostri dati è la nostra massima priorità. Operiamo in piena conformità con gli standard svizzeri ed europei.",
    privacyPoint1: "Protezione Dati: Seguiamo rigorosamente la Legge federale sulla protezione dei dati (LPD).",
    privacyPoint2: "Residenza Dati: Tutti i dati sono memorizzati ed elaborati esclusivamente in Svizzera.",
    privacyPoint3: "Nessuna Ritenzione: I documenti vengono analizzati in memoria e non memorizzati permanentemente.",
    privacyPoint4: "Crittografia: Tutti i trasferimenti di dati sono crittografati tramite TLS 1.3.",
    termsTitle: "Termini di Servizio",
    termsDesc: "Utilizzando SwissGuard AI, accettate i seguenti termini e condizioni d'uso.",
    termsPoint1: "Scopo: SwissGuard AI è uno strumento di conformità automatizzato a scopo informativo.",
    termsPoint2: "Nessuna Consulenza Legale: I risultati non costituiscono consulenza legale professionale.",
    termsPoint3: "Responsabilità: Gli utenti sono responsabili della verifica finale della conformità normativa.",
    termsPoint4: "Utilizzo: È vietato il reverse engineering non autorizzato o lo scraping automatizzato."
  },
  EN: {
    title: "SwissGuard AI",
    subtitle: "Compliance & Risk Auditor",
    documentation: "Documentation",
    finma: "FINMA Guidelines",
    downloadReport: "Download Report",
    heroTitle: "Institutional Grade",
    heroSubtitle: "Compliance Auditing.",
    heroDesc: "Automated risk assessment for the Swiss financial market. Verify LPD (Swiss DPA), GDPR, and FINMA regulatory alignment in seconds.",
    standardModel: "Standard (Free)",
    advancedModel: "Advanced (Paid)",
    apiKeyRequired: "API Key Required",
    apiKeyDesc: "To use the advanced auditing model, you must select an API key from a paid Google Cloud project.",
    selectKey: "Select API Key",
    learnBilling: "Learn about billing",
    uploadDoc: "Upload Document",
    dropFiles: "Drop PDF or Solidity contract here",
    runAudit: "Run Audit",
    analyzing: "Analyzing Compliance...",
    awaitingDoc: "Awaiting Document",
    awaitingDesc: "Upload a legal document or smart contract to generate a comprehensive risk and compliance report.",
    auditing: "Auditing Document...",
    auditingDesc: "Our AI is cross-referencing clauses with the latest Swiss Federal Data Protection Act and FINMA circulars.",
    riskScore: "Risk Assessment Score",
    verified: "Verified",
    docType: "Document Type",
    complianceCheck: "Regulatory Compliance Check",
    criticalIssues: "Critical Issues & Findings",
    issue: "Issue",
    suggestedFix: "Suggested Fix",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    location: "Zurich, CH",
    techDoc: "Technical Documentation",
    finmaFramework: "FINMA Regulatory Framework",
    compliant: "Compliant",
    nonCompliant: "Non-Compliant",
    swissDataResidency: "Swiss Data Residency",
    finmaCompliant: "FINMA Compliant",
    pdfReportTitle: "COMPLIANCE & RISK AUDIT REPORT",
    pdfExecutiveSummary: "Executive Summary",
    pdfCriticalFindings: "Critical Issues & Findings",
    pdfIssueLabel: "Issue",
    pdfFixLabel: "Suggested Fix",
    pdfGeneratedBy: "Generated by SwissGuard AI - Page",
    pdfOf: "of",
    pdfDate: "Date",
    riskHigh: "High",
    riskMedium: "Medium",
    riskLow: "Low",
    docDesc1: "SwissGuard AI uses advanced LLM models specifically tuned for the Swiss legal and financial landscape. Our analysis engine focuses on three main pillars:",
    docPillar1: "Data Privacy: Verification against LPD (Swiss Federal Act on Data Protection) and GDPR.",
    docPillar2: "Regulatory Alignment: Checking for compliance with FINMA circulars and guidelines.",
    docPillar3: "Risk Mitigation: Identification of unbalanced clauses and potential security vulnerabilities in smart contracts.",
    finmaDesc1: "The Swiss Financial Market Supervisory Authority (FINMA) sets strict standards for operational risk and outsourcing. SwissGuard helps institutions navigate:",
    finmaPoint1: "Circular 2018/3: Outsourcing – banks and insurers.",
    finmaPoint2: "Circular 2023/1: Operational risks and resilience.",
    finmaPoint3: "Anti-Money Laundering: Basic checks for AMLA compliance in contract structures.",
    finmaLink: "Visit Official FINMA Circulars",
    privacyTitle: "Privacy Policy",
    privacyDesc: "Protecting your data is our top priority. We operate in full compliance with Swiss and European standards.",
    privacyPoint1: "Data Protection: We strictly follow the Swiss Federal Act on Data Protection (LPD).",
    privacyPoint2: "Data Residency: All data is stored and processed exclusively in Switzerland.",
    privacyPoint3: "No Data Retention: Documents are analyzed in memory and not permanently stored.",
    privacyPoint4: "Encryption: All data transfers are encrypted using TLS 1.3.",
    termsTitle: "Terms of Service",
    termsDesc: "By using SwissGuard AI, you agree to the following terms and conditions.",
    termsPoint1: "Purpose: SwissGuard AI is an automated compliance tool for informational purposes.",
    termsPoint2: "No Legal Advice: Results do not constitute professional legal advice.",
    termsPoint3: "Liability: Users are responsible for final verification of regulatory compliance.",
    termsPoint4: "Usage: Unauthorized reverse engineering or automated scraping is prohibited."
  },
  DE: {
    title: "SwissGuard AI",
    subtitle: "Compliance- & Risiko-Auditor",
    documentation: "Dokumentation",
    finma: "FINMA-Richtlinien",
    downloadReport: "Bericht herunterladen",
    heroTitle: "Institutionelle",
    heroSubtitle: "Compliance-Prüfung.",
    heroDesc: "Automatisierte Risikobewertung für den Schweizer Finanzmarkt. Überprüfen Sie in Sekundenschnelle die Ausrichtung an LPD (DSG), DSGVO und FINMA-Vorschriften.",
    standardModel: "Standard (Kostenlos)",
    advancedModel: "Erweitert (Kostenpflichtig)",
    apiKeyRequired: "API-Schlüssel erforderlich",
    apiKeyDesc: "Um das erweiterte Audit-Modell zu verwenden, müssen Sie einen API-Schlüssel aus einem kostenpflichtigen Google Cloud-Projekt auswählen.",
    selectKey: "API-Schlüssel auswählen",
    learnBilling: "Erfahren Sie mehr über die Abrechnung",
    uploadDoc: "Dokument hochladen",
    dropFiles: "PDF oder Solidity-Vertrag hier ablegen",
    runAudit: "Audit ausführen",
    analyzing: "Compliance-Analyse...",
    awaitingDoc: "Warten auf Dokument",
    awaitingDesc: "Laden Sie ein rechtliches Dokument oder einen Smart Contract hoch, um einen umfassenden Risiko- und Compliance-Bericht zu erstellen.",
    auditing: "Dokument wird geprüft...",
    auditingDesc: "Unsere KI gleicht Klauseln mit dem neuesten Bundesgesetz über den Datenschutz und FINMA-Rundschreiben ab.",
    riskScore: "Risikobewertung",
    verified: "Verifiziert",
    docType: "Dokumententyp",
    complianceCheck: "Regulatorische Compliance-Prüfung",
    criticalIssues: "Kritische Probleme & Ergebnisse",
    issue: "Problem",
    suggestedFix: "Vorgeschlagene Lösung",
    privacyPolicy: "Datenschutzrichtlinie",
    termsOfService: "Nutzungsbedingungen",
    location: "Zürich, CH",
    techDoc: "Technische Dokumentation",
    finmaFramework: "FINMA-Regulierungsrahmen",
    compliant: "Konform",
    nonCompliant: "Nicht Konform",
    swissDataResidency: "Schweizer Datenresidenz",
    finmaCompliant: "FINMA-konform",
    pdfReportTitle: "COMPLIANCE- UND RISIKO-AUDIT-BERICHT",
    pdfExecutiveSummary: "Zusammenfassung",
    pdfCriticalFindings: "Kritische Probleme & Ergebnisse",
    pdfIssueLabel: "Problem",
    pdfFixLabel: "Vorgeschlagene Lösung",
    pdfGeneratedBy: "Generiert von SwissGuard AI - Seite",
    pdfOf: "von",
    pdfDate: "Datum",
    riskHigh: "Hoch",
    riskMedium: "Mittel",
    riskLow: "Niedrig",
    docDesc1: "SwissGuard AI verwendet fortschrittliche LLM-Modelle, die speziell auf die Schweizer Rechts- und Finanzlandschaft abgestimmt sind. Unsere Analyse-Engine konzentriert sich auf drei Hauptpfeiler:",
    docPillar1: "Datenschutz: Überprüfung gegen LPD (DSG) und DSGVO.",
    docPillar2: "Regulatorische Ausrichtung: Prüfung der Einhaltung von FINMA-Rundschreiben und -Richtlinien.",
    docPillar3: "Risikominderung: Identifizierung unausgewogener Klauseln und potenzieller Sicherheitslücken in Smart Contracts.",
    finmaDesc1: "Die Eidgenössische Finanzmarktaufsicht (FINMA) setzt strenge Standards für operationelle Risiken und Outsourcing. SwissGuard hilft Institutionen bei der Navigation:",
    finmaPoint1: "Rundschreiben 2018/3: Outsourcing – Banken und Versicherer.",
    finmaPoint2: "Rundschreiben 2023/1: Operationelle Risiken und Resilienz.",
    finmaPoint3: "Geldwäscherei: Basisprüfungen zur GwG-Konformität in Vertragsstrukturen.",
    finmaLink: "Offizielle FINMA-Rundschreiben besuchen",
    privacyTitle: "Datenschutzrichtlinie",
    privacyDesc: "Der Schutz Ihrer Daten hat für uns oberste Priorität. Wir arbeiten in voller Übereinstimmung mit schweizerischen und europäischen Standards.",
    privacyPoint1: "Datenschutz: Wir halten uns strikt an das Bundesgesetz über den Datenschutz (DSG).",
    privacyPoint2: "Datenresidenz: Alle Daten werden ausschliesslich in der Schweiz gespeichert und verarbeitet.",
    privacyPoint3: "Keine Datenspeicherung: Dokumente werden im Arbeitsspeicher analysiert und nicht dauerhaft gespeichert.",
    privacyPoint4: "Verschlüsselung: Alle Datenübertragungen sind mit TLS 1.3 verschlüsselt.",
    termsTitle: "Nutzungsbedingungen",
    termsDesc: "Durch die Nutzung von SwissGuard AI erklären Sie sich con den folgenden Bedingungen einverstanden.",
    termsPoint1: "Zweck: SwissGuard AI ist ein automatisiertes Compliance-Tool zu Informationszwecken.",
    termsPoint2: "Keine Rechtsberatung: Die Ergebnisse stellen keine professionelle Rechtsberatung dar.",
    termsPoint3: "Haftung: Die Nutzer sind für die endgültige Überprüfung der regulatorischen Compliance verantwortlich.",
    termsPoint4: "Nutzung: Unbefugtes Reverse Engineering oder automatisiertes Scraping ist untersagt."
  },
  FR: {
    title: "SwissGuard AI",
    subtitle: "Auditeur de Conformité et de Risque",
    documentation: "Documentation",
    finma: "Directives de la FINMA",
    downloadReport: "Télécharger le Rapport",
    heroTitle: "Audit de Conformité",
    heroSubtitle: "de Niveau Institutionnel.",
    heroDesc: "Évaluation automatisée des risques per le marché financier suisse. Vérifiez l'alignement réglementaire LPD (LPD suisse), RGPD et FINMA en quelques secondes.",
    standardModel: "Standard (Gratuit)",
    advancedModel: "Avancé (Payant)",
    apiKeyRequired: "Clé API Requise",
    apiKeyDesc: "Pour utiliser le modèle d'audit avancé, vous devez sélectionner une clé API d'un projet Google Cloud payant.",
    selectKey: "Sélectionner une Clé API",
    learnBilling: "En savoir plus sur la facturation",
    uploadDoc: "Charger le Document",
    dropFiles: "Déposez un PDF o un contrat Solidity ici",
    runAudit: "Exécuter l'Audit",
    analyzing: "Analyse de Conformité...",
    awaitingDoc: "En attente du document",
    awaitingDesc: "Chargez un document juridique ou un smart contract pour générer un rapport complet sur les risques et la conformité.",
    auditing: "Audit du document...",
    auditingDesc: "Notre IA croise les clauses avec les dernières circulaires de la FINMA et la loi fédérale sur la protection des données.",
    riskScore: "Score d'Évaluation des Risques",
    verified: "Vérifié",
    docType: "Type de Document",
    complianceCheck: "Contrôle de Conformité Réglementaire",
    criticalIssues: "Problèmes Critiques et Résultats",
    issue: "Problème",
    suggestedFix: "Solution Suggérée",
    privacyPolicy: "Politique de Confidentialité",
    termsOfService: "Conditions d'Utilisation",
    location: "Zurich, CH",
    techDoc: "Documentation Technique",
    finmaFramework: "Cadre Réglementaire de la FINMA",
    compliant: "Conforme",
    nonCompliant: "Non Conforme",
    swissDataResidency: "Résidence des données en Suisse",
    finmaCompliant: "Conforme à la FINMA",
    pdfReportTitle: "RAPPORT D'AUDIT DE CONFORMITÉ ET DE RISQUE",
    pdfExecutiveSummary: "Résumé Exécutif",
    pdfCriticalFindings: "Problèmes Critiques et Résultats",
    pdfIssueLabel: "Problème",
    pdfFixLabel: "Solution Suggérée",
    pdfGeneratedBy: "Généré par SwissGuard AI - Page",
    pdfOf: "sur",
    pdfDate: "Date",
    riskHigh: "Élevé",
    riskMedium: "Moyen",
    riskLow: "Faible",
    docDesc1: "SwissGuard AI utilise des modèles LLM avancés spécifiquement adaptés au paysage juridique et financier suisse. Notre moteur d'analyse se concentre sur trois piliers principaux :",
    docPillar1: "Protection des Données : Vérification par rapport à la LPD (Loi fédérale sur la protection des données) et au RGPD.",
    docPillar2: "Alignement Réglementaire : Contrôle de la conformità aux circulaires et directives de la FINMA.",
    docPillar3: "Atténuation des Risques : Identification des clauses déséquilibrées et des vulnérabilités de sécurité potentielles dans les smart contracts.",
    finmaDesc1: "L'Autorité fédérale de surveillance des marchés financiers (FINMA) établit des normes strictes en matière de risque opérationnel et d'externalisation. SwissGuard aide les institutions à naviguer :",
    finmaPoint1: "Circulaire 2018/3 : Externalisation – banques et assureurs.",
    finmaPoint2: "Circulaire 2023/1 : Risques opérationnels et résilience.",
    finmaPoint3: "Lutte contre le blanchiment d'argent : Contrôles de base pour la conformité à la LBA dans les structures contractuelles.",
    finmaLink: "Visiter les circulaires officielles de la FINMA",
    privacyTitle: "Politique de Confidentialité",
    privacyDesc: "La protection de vos données est notre priorité absolue. Nous opérons en totale conformité avec les normes suisses et européennes.",
    privacyPoint1: "Protection des données : Nous suivons strictement la loi fédérale sur la protection des données (LPD).",
    privacyPoint2: "Résidence des données : Toutes les données sont stockées et traitées exclusivement en Suisse.",
    privacyPoint3: "Pas de rétention : Les documents sont analysés en mémoire et ne sono pas stockés de façon permanente.",
    privacyPoint4: "Chiffrement : Tous les transferts de données sont chiffrés via TLS 1.3.",
    termsTitle: "Conditions d'Utilisation",
    termsDesc: "En utilisant SwissGuard AI, vous acceptez les conditions d'utilisation suivantes.",
    termsPoint1: "Objectif : SwissGuard AI est un outil de conformité automatisé à des fins d'information.",
    termsPoint2: "Pas de conseil juridique : Les résultats ne constituent pas un conseil juridique professionnel.",
    termsPoint3: "Responsabilité : Les utilisateurs sono responsables de la vérification finale de la conformité réglementaire.",
    termsPoint4: "Utilisation : L'ingénierie inverse non autorisée o le scraping automatisé sont interdits."
  }
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultLang, setResultLang] = useState<'IT' | 'EN' | 'DE' | 'FR' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'free' | 'advanced'>('free');
  const [isIframe, setIsIframe] = useState(false);

  const [activeInfo, setActiveInfo] = useState<'doc' | 'finma' | 'privacy' | 'terms' | null>(null);
  const [lang, setLang] = useState<'IT' | 'EN' | 'DE' | 'FR'>('EN');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const flags = {
    IT: 'https://flagcdn.com/w40/it.png',
    EN: 'https://flagcdn.com/w40/gb.png',
    DE: 'https://flagcdn.com/w40/de.png',
    FR: 'https://flagcdn.com/w40/fr.png'
  };

  const t = (key: keyof typeof translations['EN']) => translations[lang][key] || translations['EN'][key];

  React.useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiStatus, setApiStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true); // Fallback if not in AI Studio environment
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  React.useEffect(() => {
    const checkHealth = async () => {
      console.log("Checking API health...");
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log('API Health Check:', data);
        setApiStatus('ready');
      } catch (err) {
        console.error('API Health Check Failed:', err);
        setApiStatus('error');
      }
    };
    checkHealth();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const analyzeDocument = async () => {
    if (!file) return;

    // Check for API key if using advanced model
    if (modelType === 'advanced' && hasKey === false) {
      const confirmed = await window.aistudio?.hasSelectedApiKey();
      if (!confirmed) {
        setError("Please select an API key to use the Advanced model.");
        return;
      }
      setHasKey(true);
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const currentLang = lang;
      
      // 1. Extract text client-side to bypass cookie issues
      let text = '';
      try {
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          text = fullText;
        } else {
          // Assume text file (Solidity, etc.)
          text = await file.text();
        }
      } catch (extractErr: any) {
        console.error("Client-side extraction failed, falling back to server:", extractErr);
        
        // Fallback to server if client-side fails (though server might still be blocked)
        const formData = new FormData();
        formData.append('file', file);

        const extractResponse = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        });

        const contentType = extractResponse.headers.get('content-type');
        
        if (!extractResponse.ok) {
          let errorMessage = 'Failed to extract text';
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errData = await extractResponse.json();
              errorMessage = errData.error || errorMessage;
            } catch (e) {
              errorMessage = `Error parsing JSON: ${extractResponse.status} ${extractResponse.statusText}`;
            }
          } else {
            const responseText = await extractResponse.text();
            if (responseText.includes('Cookie check') || responseText.includes('Authenticate in new window')) {
              errorMessage = "Security Check Required: Your browser is blocking cookies in the preview iframe. Please open the application in a new tab to authenticate, then return here and try again.";
            } else {
              errorMessage = `Server returned non-JSON error (${extractResponse.status}). This often happens when the preview session expires or is blocked by browser security. Try opening the app in a new tab.`;
            }
          }
          throw new Error(errorMessage);
        }

        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await extractResponse.text();
          if (responseText.includes('Cookie check') || responseText.includes('Authenticate in new window')) {
            throw new Error("Security Check Required: Your browser is blocking cookies in the preview iframe. Please open the application in a new tab to authenticate, then return here and try again.");
          }
          throw new Error(`Server returned non-JSON response for text extraction. Try opening the app in a new tab.`);
        }
        
        const data = await extractResponse.json();
        text = data.text;
      }

      if (!text || text.trim().length === 0) {
        throw new Error("No text could be extracted from the document. Please ensure it's not a scanned image or an empty file.");
      }

      // 2. Call Gemini
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const selectedModel = modelType === 'free' ? "gemini-3-flash-preview" : "gemini-3.1-pro-preview";
      
      const model = genAI.models.generateContent({
        model: selectedModel,
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
          systemInstruction: getSystemInstruction(currentLang),
          responseMimeType: "application/json",
        },
      });

      const response = await model;
      const resultText = response.text;
      
      if (!resultText) throw new Error("No response from AI");
      
      const parsedResult: AnalysisResult = JSON.parse(resultText);
      setResult(parsedResult);
      setResultLang(currentLang);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setError("API Key error: Requested entity was not found. Please re-select your API key.");
      } else {
        setError(err.message || "An error occurred during analysis.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  React.useEffect(() => {
    if (result && resultLang && lang !== resultLang && !isAnalyzing) {
      const translateResult = async () => {
        const targetLang = lang;
        setIsAnalyzing(true);
        try {
          const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          const model = genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ 
              role: "user", 
              parts: [{ text: JSON.stringify(result) }] 
            }],
            config: {
              systemInstruction: `Traduci il seguente oggetto JSON di analisi legale nella lingua: ${targetLang}. 
              Mantieni ESATTAMENTE la stessa struttura JSON. 
              Traduci tutti i valori testuali (document_type, summary, clause, issue, suggested_fix, regulation, notes).
              
              REGOLE CRITICHE:
              1. I valori del campo "status" devono rimanere ESATTAMENTE "Compliant" o "Non-Compliant". NON TRADURLI.
              2. I valori del campo "risk_level" devono rimanere ESATTAMENTE "High", "Medium" o "Low". NON TRADURLI.
              3. Traduci tutto il resto del contenuto testuale in modo professionale e accurato per il contesto legale svizzero.
              
              IMPORTANTE: Rispondi ESCLUSIVAMENTE con l'oggetto JSON tradotto, senza commenti o markdown.`,
              responseMimeType: "application/json",
            },
          });

          const response = await model;
          const resultText = response.text;
          if (resultText) {
            const parsedResult: AnalysisResult = JSON.parse(resultText);
            setResult(parsedResult);
            setResultLang(targetLang);
          }
        } catch (err) {
          console.error("Translation error:", err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      translateResult();
    }
  }, [lang, result, resultLang, isAnalyzing]);

  const generatePDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text("SwissGuard AI", margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(t('pdfReportTitle'), margin, y);
    y += 15;

    // Document Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`${t('docType')}: ${result.document_type}`, margin, y);
    y += 7;
    doc.text(`${t('riskScore')}: ${result.risk_score}/100`, margin, y);
    y += 15;

    // Summary
    doc.setFontSize(14);
    doc.text(t('pdfExecutiveSummary'), margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(result.summary, 170);
    doc.text(summaryLines, margin, y);
    y += (summaryLines.length * 5) + 15;

    // Critical Issues
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(t('pdfCriticalFindings'), margin, y);
    y += 10;

    result.critical_issues.forEach((issue, index) => {
      const issueLines = doc.splitTextToSize(`${t('pdfIssueLabel')}: ${issue.issue}`, 160);
      const fixLines = doc.splitTextToSize(`${t('pdfFixLabel')}: ${issue.suggested_fix}`, 160);
      const issueHeight = 7 + (issueLines.length * 5) + 5 + (fixLines.length * 5) + 10;

      if (y + issueHeight > 275) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${index + 1}. [${getTranslatedRisk(issue.risk_level)}] ${issue.clause}`, margin, y);
      y += 7;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(issueLines, margin + 5, y);
      y += (issueLines.length * 5) + 5;
      
      doc.setTextColor(16, 185, 129);
      doc.text(fixLines, margin + 5, y);
      doc.setTextColor(0, 0, 0);
      y += (fixLines.length * 5) + 10;
    });

    // Compliance Check
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(t('complianceCheck'), margin, y);
    y += 12;

    result.compliance_check.forEach((check) => {
      const noteLines = doc.splitTextToSize(check.notes, 160);
      const checkHeight = 7 + (noteLines.length * 5) + 8;

      if (y + checkHeight > 275) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const regText = `${check.regulation}: `;
      doc.text(regText, margin, y);
      
      const statusText = check.status === 'Compliant' ? t('compliant') : t('nonCompliant');
      const statusColor = check.status === 'Compliant' ? [16, 185, 129] : [244, 63, 94];
      
      const regWidth = doc.getTextWidth(regText);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusText, margin + regWidth + 2, y);
      doc.setTextColor(0, 0, 0);
      y += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(noteLines, margin + 5, y);
      y += (noteLines.length * 5) + 8;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${t('pdfGeneratedBy')} ${i} ${t('pdfOf')} ${pageCount}`, margin, 285);
      doc.text(`${t('pdfDate')}: ${new Date().toLocaleString(lang.toLowerCase())}`, 150, 285);
    }

    doc.save(`SwissGuard_Audit_${result.document_type.replace(/\s+/g, '_')}.pdf`);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-emerald-500 bg-emerald-500/10';
    if (score < 70) return 'text-amber-500 bg-amber-500/10';
    return 'text-rose-500 bg-rose-500/10';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
      case 'medium': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'low': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
      default: return 'text-slate-500 border-slate-500/20 bg-slate-500/5';
    }
  };

  const getTranslatedRisk = (level: string) => {
    const l = level.toLowerCase();
    if (l === 'high') return t('riskHigh');
    if (l === 'medium') return t('riskMedium');
    if (l === 'low') return t('riskLow');
    return level;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Shield className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">{t('title')} <span className="text-emerald-500">AI</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">{t('subtitle')}</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveInfo('doc')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {t('documentation')}
            </button>
            <button 
              onClick={() => setActiveInfo('finma')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {t('finma')}
            </button>
            
            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
              >
                <img src={flags[lang]} alt={lang} className="w-4 h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                {lang}
                <ChevronDown className={cn("w-3 h-3 transition-transform", isLangOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-24 bg-[#121214] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20"
                    >
                      {(['IT', 'EN', 'DE', 'FR'] as const).map((l) => (
                        <button
                          key={l}
                          onClick={() => {
                            setLang(l);
                            setIsLangOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-xs font-bold hover:bg-white/5 transition-colors flex items-center gap-2",
                            lang === l ? "text-emerald-500 bg-emerald-500/5" : "text-slate-400"
                          )}
                        >
                          <img src={flags[l]} alt={l} className="w-4 h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                          {l}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {result && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={generatePDF}
                className="text-sm font-bold bg-emerald-500 text-black px-5 py-2 rounded-full hover:bg-emerald-400 transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <Download className="w-4 h-4" />
                {t('downloadReport')}
              </motion.button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Upload & Info */}
          <div className="lg:col-span-5 space-y-8">
            <section>
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                {t('heroTitle')} <br />
                <span className="text-emerald-500 italic">{t('heroSubtitle')}</span>
              </h2>
              <p className="text-slate-400 leading-relaxed max-w-md">
                {t('heroDesc')}
              </p>
            </section>

            {apiStatus === 'error' && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm mb-4">
                <p className="font-bold">Backend API Connection Failed</p>
                <p className="text-xs opacity-80">The server might still be starting up. Please wait a moment and refresh.</p>
              </div>
            )}

            {/* Model Selection */}
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-1 mb-6 flex">
              <button 
                onClick={() => setModelType('free')}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  modelType === 'free' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <CheckCircle2 className={cn("w-4 h-4", modelType === 'free' ? "text-emerald-500" : "text-slate-600")} />
                {t('standardModel')}
              </button>
              <button 
                onClick={() => setModelType('advanced')}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  modelType === 'advanced' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Shield className={cn("w-4 h-4", modelType === 'advanced' ? "text-amber-500" : "text-slate-600")} />
                {t('advancedModel')}
              </button>
            </div>

            {hasKey === false && modelType === 'advanced' && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{t('apiKeyRequired')}</h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      {t('apiKeyDesc')}
                    </p>
                    <button 
                      onClick={handleSelectKey}
                      className="text-xs font-bold bg-amber-500 text-black px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
                    >
                      {t('selectKey')}
                    </button>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block mt-2 text-[10px] text-slate-500 hover:text-slate-300 underline"
                    >
                      {t('learnBilling')}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer overflow-hidden",
                file ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-emerald-500/30 hover:bg-white/5"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.sol,.txt"
              />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                  file ? "bg-emerald-500 text-black" : "bg-white/5 text-slate-400"
                )}>
                  {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {file ? file.name : t('uploadDoc')}
                </h3>
                <p className="text-sm text-slate-500">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : t('dropFiles')}
                </p>
              </div>
              
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
            </div>

            <button
              onClick={analyzeDocument}
              disabled={!file || isAnalyzing}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl",
                !file || isAnalyzing 
                  ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                  : "bg-emerald-500 text-black hover:bg-emerald-400 hover:-translate-y-1 active:translate-y-0 shadow-emerald-500/20"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <Search className="w-6 h-6" />
                  {t('runAudit')}
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
                {error.includes("Security Check Required") && isIframe && (
                  <button
                    onClick={openInNewTab}
                    className="self-start px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    Open in New Tab
                  </button>
                )}
              </motion.div>
            )}

            {/* Trust Badges */}
            <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <Lock className="w-3 h-3" /> {t('swissDataResidency')}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <Scale className="w-3 h-3" /> {t('finmaCompliant')}
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] border border-white/5 rounded-[2rem] bg-white/[0.02] flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <BarChart3 className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t('awaitingDoc')}</h3>
                  <p className="text-slate-500 max-w-xs">
                    {t('awaitingDesc')}
                  </p>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] border border-white/5 rounded-[2rem] bg-white/[0.02] flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 italic">{t('auditing')}</h3>
                  <p className="text-slate-500 max-w-xs">
                    {t('auditingDesc')}
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Risk Score Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white/[0.03] border border-white/5 rounded-3xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('riskScore')}</span>
                        <span className="text-xs font-bold text-emerald-500">{t('verified')}</span>
                      </div>
                      <div className="flex items-end gap-4">
                        <span className={cn("text-7xl font-black tracking-tighter", getRiskColor(result!.risk_score).split(' ')[0])}>
                          {result!.risk_score}
                        </span>
                        <div className="mb-3">
                          <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${result!.risk_score}%` }}
                              className={cn("h-full", getRiskColor(result!.risk_score).split(' ')[1].replace('/10', ''))}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="mt-6 text-slate-400 text-sm leading-relaxed break-words">
                        {result!.summary}
                      </p>
                    </div>
                    
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('docType')}</span>
                      <div className="mt-4">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
                          {/contract|contratto|vertrag|contrat|solidity|code/i.test(result!.document_type) ? (
                            <Code2 className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <FileText className="w-6 h-6 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-xl font-bold text-white capitalize break-words">{result!.document_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Checklist */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-white">{t('complianceCheck')}</h4>
                    </div>
                    <div className="divide-y divide-white/5">
                      {result!.compliance_check.map((check, idx) => (
                        <div key={idx} className="px-8 py-5 flex items-start justify-between gap-4 group hover:bg-white/[0.01] transition-colors">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="mt-1 shrink-0">
                              {check.status === 'Compliant' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white break-words">{check.regulation}</p>
                              <p className="text-xs text-slate-500 break-words mt-1">{check.notes}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-1 rounded-md border shrink-0 mt-1",
                            check.status === 'Compliant' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-rose-500 border-rose-500/20 bg-rose-500/5"
                          )}>
                            {check.status === 'Compliant' ? t('compliant') : t('nonCompliant')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Critical Issues */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 ml-2">{t('criticalIssues')}</h4>
                    {result!.critical_issues.map((issue, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                            <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-md border shrink-0", getRiskLevelColor(issue.risk_level))}>
                              {getTranslatedRisk(issue.risk_level)}
                            </span>
                            <h5 className="text-sm font-bold text-white italic break-words flex-1 min-w-0">"{issue.clause}"</h5>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                        </div>
                        <p className="text-sm text-slate-400 mb-4 break-words">
                          <span className="text-white font-semibold">{t('issue')}:</span> {issue.issue}
                        </p>
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-xs text-emerald-500 break-words">
                            <span className="font-bold uppercase tracking-tighter mr-2 shrink-0">{t('suggestedFix')}:</span>
                            {issue.suggested_fix}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-slate-500 tracking-tighter">{t('title')} v1.0.0</span>
        </div>
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveInfo('privacy')}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-white transition-colors"
          >
            {t('privacyPolicy')}
          </button>
          <button 
            onClick={() => setActiveInfo('terms')}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-white transition-colors"
          >
            {t('termsOfService')}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">SwissGuardAI - 2026</span>
        </div>
      </footer>

      {/* Info Modal */}
      <AnimatePresence>
        {activeInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveInfo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#121214] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      {activeInfo === 'doc' && <FileText className="text-emerald-500 w-5 h-5" />}
                      {activeInfo === 'finma' && <Scale className="text-emerald-500 w-5 h-5" />}
                      {activeInfo === 'privacy' && <Shield className="text-emerald-500 w-5 h-5" />}
                      {activeInfo === 'terms' && <FileText className="text-emerald-500 w-5 h-5" />}
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {activeInfo === 'doc' && t('techDoc')}
                      {activeInfo === 'finma' && t('finmaFramework')}
                      {activeInfo === 'privacy' && t('privacyTitle')}
                      {activeInfo === 'terms' && t('termsTitle')}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveInfo(null)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6 text-slate-400 leading-relaxed">
                  {activeInfo === 'doc' && (
                    <>
                      <p>{t('docDesc1')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>{t('docPillar1')}</li>
                        <li>{t('docPillar2')}</li>
                        <li>{t('docPillar3')}</li>
                      </ul>
                    </>
                  )}
                  {activeInfo === 'finma' && (
                    <>
                      <p>{t('finmaDesc1')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>{t('finmaPoint1')}</li>
                        <li>{t('finmaPoint2')}</li>
                        <li>{t('finmaPoint3')}</li>
                      </ul>
                      <a 
                        href="https://www.finma.ch/en/documentation/circulars/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-500 font-bold hover:underline mt-4"
                      >
                        {t('finmaLink')} <ChevronRight className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  {activeInfo === 'privacy' && (
                    <>
                      <p>{t('privacyDesc')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>{t('privacyPoint1')}</li>
                        <li>{t('privacyPoint2')}</li>
                        <li>{t('privacyPoint3')}</li>
                        <li>{t('privacyPoint4')}</li>
                      </ul>
                    </>
                  )}
                  {activeInfo === 'terms' && (
                    <>
                      <p>{t('termsDesc')}</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>{t('termsPoint1')}</li>
                        <li>{t('termsPoint2')}</li>
                        <li>{t('termsPoint3')}</li>
                        <li>{t('termsPoint4')}</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
