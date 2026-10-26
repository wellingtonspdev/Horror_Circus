import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "./ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import type { ResultEnvelope } from "../lib/tse/types";
import { number, dateTime, percent } from "./election";
export function BackstageDrawer({ data }: { data: ResultEnvelope }) {
  const r = data.result;
  const rows = [
    ["Eleitorado", number(r.electorate.total)],
    [
      "Comparecimento",
      `${number(r.electorate.turnout)} (${percent(r.electorate.turnoutPercent)}%)`,
    ],
    [
      "Abstenção",
      `${number(r.electorate.abstentions)} (${percent(r.electorate.abstentionPercent)}%)`,
    ],
    ["Votos válidos", number(r.votes.valid)],
    ["Brancos", number(r.votes.blank)],
    ["Nulos", number(r.votes.null)],
    ["Seções totalizadas", number(r.progress.countedSections)],
    ["Seções restantes", number(r.progress.pendingSections)],
    [
      "Seções instaladas",
      r.progress.installedSections === undefined
        ? "Não informado"
        : number(r.progress.installedSections),
    ],
    [
      "Seções não instaladas",
      r.progress.notInstalledSections === undefined
        ? "Não informado"
        : number(r.progress.notInstalledSections),
    ],
    ["Eleição", r.electionCode],
    ["ID da geração", r.generationId],
    ["Geração TSE", dateTime(r.generatedAt)],
    ["Assinatura JWS", data.verified ? "Verificada" : "Não verificada"],
  ];
  return (
    <div className="backstage-link">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">
            Ver bastidores da apuração <span aria-hidden="true">↗</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bastidores da apuração</SheetTitle>
            <SheetDescription>
              Os números oficiais, sem mudança de conteúdo.
            </SheetDescription>
          </SheetHeader>
          <dl className="backstage-grid px-6">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="data-note px-6">
            Estado TSE: {r.status}. {r.warnings.join(" ")}
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
export function SourceMethodModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Sobre os dados
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>De onde vêm os dados?</DialogTitle>
          <DialogDescription>
            Fonte oficial. Apresentação independente.
          </DialogDescription>
        </DialogHeader>
        <div className="data-note">
          <p>
            Consultamos a distribuição oficial do Tribunal Superior Eleitoral.
            Os resultados nacionais de Presidente vêm do arquivo EA20.
          </p>
          <p>
            A atualização ocorre a cada 5 segundos, com pausa em segundo plano e
            espera progressiva em falhas. O último resultado válido permanece
            visível.
          </p>
          <p>
            O Astro Change não calcula nem declara vencedor. A indicação de
            resultado definido depende exclusivamente do TSE.
          </p>
          <p>
            O selo de assinatura só aparece após verificação criptográfica JWS.
            JSON sem assinatura é identificado na tela.
          </p>
          <a
            href="https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados"
            target="_blank"
            rel="noreferrer"
          >
            Documentação oficial do TSE ↗
          </a>
          <p>
            Projeto independente, sem vínculo institucional com a Justiça
            Eleitoral.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
