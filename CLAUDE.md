# Diretrizes do Projeto SGI Frontend

## Estrutura de componentes no pacote `features`

Sempre que criar um novo componente dentro de `src/app/features/`, ele deve seguir obrigatoriamente a estrutura de três arquivos separados:

```
nome-do-componente/
├── nome-do-componente.component.ts    ← lógica da classe + @Component com templateUrl e styleUrl
├── nome-do-componente.component.html  ← template HTML
└── nome-do-componente.component.css   ← estilos CSS
```

O decorator `@Component` no `.ts` deve referenciar os arquivos externos:

```typescript
@Component({
  selector: 'app-nome',
  standalone: true,
  imports: [...],
  templateUrl: './nome-do-componente.component.html',
  styleUrl: './nome-do-componente.component.css',
})
```

Componentes auxiliares pequenos (ex: dialogs inline) podem permanecer com template/styles inline no mesmo `.ts`, desde que sejam helpers do componente principal e não tenham lógica de template complexa.
