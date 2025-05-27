# Regras do Projeto

## Regra de Alteração de Código

- O agente deve fazer alterações **somente** na página ou tela mencionada na solicitação.
- Não deve haver alterações em páginas ou funções de outras páginas.
- O foco deve ser exclusivamente no que foi pedido, sem extrapolações ou suposições.

## Exemplo de Aplicação

Se uma solicitação for feita para alterar a `HomePage`, o agente deve:
- Localizar e modificar apenas o código relacionado à `HomePage`.
- Ignorar qualquer código ou função que pertença a outras páginas, como `AboutPage` ou `ContactPage`.
