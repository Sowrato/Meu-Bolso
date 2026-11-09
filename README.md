# Meu Bolso — projeto Android

Aplicativo de controle financeiro offline, com interface em HTML/CSS/JavaScript e empacotamento Android via Capacitor.

## Recursos iniciais
- Cadastro de receitas e despesas
- Categorias editáveis
- Dashboard e saldo acumulado
- Relatório por período personalizado
- Comparativo dos últimos seis meses
- Projeção simples de saldo (média dos seis meses)
- Exportação CSV e backup/restauração JSON
- Persistência local usando Capacitor Preferences

## Gerar APK
O GitHub Actions executa a compilação ao enviar os arquivos para `main` ou `master`, ou manualmente em Actions > Build Meu Bolso APK > Run workflow. O artefato `MeuBolso-debug-apk` contém `app-debug.apk`.

## Observação
Este primeiro pacote usa armazenamento persistente local do Android via Capacitor Preferences (não SQLite). O APK debug serve para instalação e testes. Faça backup regular dos dados. A compilação ainda precisa ser executada e o APK testado em aparelho real.
