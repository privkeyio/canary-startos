export const short = {
  en_US: 'Bitcoin wallet monitoring service with transaction notifications',
  es_ES:
    'Servicio de monitoreo de billeteras Bitcoin con notificaciones de transacciones',
  de_DE: 'Bitcoin-Wallet-Überwachungsdienst mit Transaktionsbenachrichtigungen',
  pl_PL:
    'Usługa monitorowania portfeli Bitcoin z powiadomieniami o transakcjach',
  fr_FR:
    'Service de surveillance de portefeuilles Bitcoin avec notifications de transactions',
}

export const long = {
  en_US: `Canary Wallet is a self-hosted Bitcoin wallet monitoring service that provides:
- Watch-only wallet management using BDK (Bitcoin Development Kit)
- Real-time transaction notifications via ntfy.sh push notifications
- Support for multipath descriptors (P2WPKH, P2SH, P2TR, P2PKH)
- Deep scanning to detect funds at high address indexes
- Transaction analysis including RBF/CPFP detection
- Multi-language support (English and Norwegian)
- Balance alerts with configurable thresholds

Perfect for monitoring your cold storage wallets or watching family members' wallets.`,
  es_ES: `Canary Wallet es un servicio autohospedado de monitoreo de billeteras Bitcoin que ofrece:
- Gestión de billeteras de solo lectura usando BDK (Bitcoin Development Kit)
- Notificaciones de transacciones en tiempo real a través de ntfy.sh
- Soporte para descriptores multirruta (P2WPKH, P2SH, P2TR, P2PKH)
- Escaneo profundo para detectar fondos en índices de direcciones altos
- Análisis de transacciones incluyendo detección de RBF/CPFP
- Soporte multilingüe (inglés y noruego)
- Alertas de saldo con umbrales configurables

Perfecto para monitorear sus billeteras de almacenamiento en frío o las billeteras de familiares.`,
  de_DE: `Canary Wallet ist ein selbst gehosteter Bitcoin-Wallet-Überwachungsdienst, der bietet:
- Schreibgeschützte Wallet-Verwaltung mit BDK (Bitcoin Development Kit)
- Echtzeit-Transaktionsbenachrichtigungen über ntfy.sh Push-Benachrichtigungen
- Unterstützung für Multipath-Deskriptoren (P2WPKH, P2SH, P2TR, P2PKH)
- Tiefenscan zur Erkennung von Guthaben bei hohen Adressindizes
- Transaktionsanalyse einschließlich RBF/CPFP-Erkennung
- Mehrsprachige Unterstützung (Englisch und Norwegisch)
- Saldoalarme mit konfigurierbaren Schwellenwerten

Perfekt zur Überwachung Ihrer Cold-Storage-Wallets oder der Wallets von Familienmitgliedern.`,
  pl_PL: `Canary Wallet to samodzielnie hostowana usługa monitorowania portfeli Bitcoin, która zapewnia:
- Zarządzanie portfelami tylko do odczytu przy użyciu BDK (Bitcoin Development Kit)
- Powiadomienia o transakcjach w czasie rzeczywistym przez ntfy.sh
- Obsługę deskryptorów wielościeżkowych (P2WPKH, P2SH, P2TR, P2PKH)
- Głębokie skanowanie w celu wykrycia środków na wysokich indeksach adresów
- Analizę transakcji, w tym wykrywanie RBF/CPFP
- Obsługę wielu języków (angielski i norweski)
- Alerty salda z konfigurowalnymi progami

Idealna do monitorowania portfeli zimnego przechowywania lub portfeli członków rodziny.`,
  fr_FR: `Canary Wallet est un service auto-hébergé de surveillance de portefeuilles Bitcoin qui offre :
- Gestion de portefeuilles en lecture seule avec BDK (Bitcoin Development Kit)
- Notifications de transactions en temps réel via ntfy.sh
- Prise en charge des descripteurs multi-chemins (P2WPKH, P2SH, P2TR, P2PKH)
- Analyse approfondie pour détecter les fonds aux index d'adresses élevés
- Analyse des transactions incluant la détection RBF/CPFP
- Support multilingue (anglais et norvégien)
- Alertes de solde avec seuils configurables

Parfait pour surveiller vos portefeuilles de stockage à froid ou ceux de vos proches.`,
}

export const fulcrumDescription = {
  en_US:
    'Used for syncing wallet data from the Bitcoin blockchain. Requires the BLAKE2b flavor of Fulcrum, the only build that serves the block headers used once the proof of work has changed to BLAKE2b.',
  es_ES:
    'Utilizado para sincronizar datos de billetera desde la cadena de bloques de Bitcoin',
  de_DE:
    'Wird zur Synchronisierung von Wallet-Daten aus der Bitcoin-Blockchain verwendet',
  pl_PL: 'Używany do synchronizacji danych portfela z łańcucha bloków Bitcoin',
  fr_FR:
    'Utilisé pour synchroniser les données du portefeuille depuis la blockchain Bitcoin',
}

export const ntfyDescription = {
  en_US:
    'Used for sending Canary Wallet notifications through a local ntfy server',
  es_ES:
    'Se utiliza para enviar notificaciones de Canary Wallet a través de un servidor ntfy local',
  de_DE:
    'Wird zum Senden von Canary-Wallet-Benachrichtigungen über einen lokalen ntfy-Server verwendet',
  pl_PL:
    'Używany do wysyłania powiadomień Canary Wallet przez lokalny serwer ntfy',
  fr_FR:
    'Utilisé pour envoyer les notifications de Canary Wallet via un serveur ntfy local',
}

export const mempoolDescription = {
  en_US: 'Used for opening Canary Wallet transaction links in local Mempool',
  es_ES:
    'Utilizado para abrir enlaces de transacciones de Canary Wallet en Mempool local',
  de_DE:
    'Wird zum Öffnen von Canary Wallet-Transaktionslinks in lokalem Mempool verwendet',
  pl_PL:
    'Używany do otwierania linków transakcji Canary Wallet w lokalnym Mempool',
  fr_FR:
    'Utilisé pour ouvrir les liens de transaction Canary Wallet dans Mempool local',
}

export const bitcoinExplorerDescription = {
  en_US:
    'Used for opening Canary Wallet transaction links in local Bitcoin Explorer',
  es_ES:
    'Utilizado para abrir enlaces de transacciones de Canary Wallet en Bitcoin Explorer local',
  de_DE:
    'Wird zum Öffnen von Canary Wallet-Transaktionslinks in lokalem Bitcoin Explorer verwendet',
  pl_PL:
    'Używany do otwierania linków transakcji Canary Wallet w lokalnym Bitcoin Explorer',
  fr_FR:
    'Utilisé pour ouvrir les liens de transaction Canary Wallet dans Bitcoin Explorer local',
}
