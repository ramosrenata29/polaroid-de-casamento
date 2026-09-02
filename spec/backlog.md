# Backlog do Projeto - Bordas de Fotos de Casamento

## Registro de Atividades

### [2026-09-02 16:52] - Inicialização do Projeto
- **Análise da especificação (`spec.md`)**: Requisitos validados com o usuário.
- **Definição de escopo**: SPA Vanilla JS, HTML, CSS, suporte a captura de câmera ao vivo (`getUserMedia`), customização de borda, fonte, cor da fonte, cor da borda, formatos (vertical, horizontal, quadrado 1:1), modo noturno e download direto da foto Polaroid.
- **Estruturação de arquivos**: Criados os diretórios `/spec`, `/css`, `/js`.

### [2026-09-02 16:56] - Implementação da Aplicação SPA Polaroid
- **Interface e Layout (`index.html` & `css/style.css`)**:
  - Design minimalista, limpo e *mobile-first*.
  - Alternância de tema claro/escuro (modo noturno) com persistência em `localStorage`.
  - Controles interativos para entrada do nome do casal, seleção de formato (vertical, quadrado 1:1, horizontal), escolha de tipografia, seletores de cores com presets rápidos (cor da borda e cor da fonte).
- **Lógica e Funcionalidade (`js/app.js`)**:
  - Integração com WebRTC (`getUserMedia`) para feed de vídeo da câmera em tempo real.
  - Opção para alternar câmera (frontal/traseira) com espelhamento apropriado.
  - Renderização via Canvas em alta definição com enquadramento proporcional (`object-fit: cover`) e overlay do texto com a fonte e cor customizadas.
  - Download imediato em formato `.png` da Polaroid gerada.
- **Compatibilidade**: Pronto para hospedagem estática no GitHub Pages.
