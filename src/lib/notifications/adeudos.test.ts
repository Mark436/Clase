import { describe, expect, it } from "vitest";
import type { Adeudos } from "sith-api-client";
import { listAdeudoAreas, listAdeudoDetails } from "./adeudos";

const NO_DEBTS: Adeudos = {
  biblioteca: "",
  academico: "",
  escolar: "",
  financiero: "",
  administrativo: "",
  tieneAdeudos: false,
};

describe("listAdeudoDetails", () => {
  it("returns no debts when every area is empty", () => {
    expect(listAdeudoDetails(NO_DEBTS)).toEqual([]);
  });

  it("ignores the API no-debt marker N (case-insensitive)", () => {
    const adeudos: Adeudos = {
      ...NO_DEBTS,
      biblioteca: "N",
      academico: "n",
      tieneAdeudos: false,
    };
    expect(listAdeudoDetails(adeudos)).toEqual([]);
  });

  it("keeps the specific detail alongside its area label", () => {
    const adeudos: Adeudos = {
      ...NO_DEBTS,
      financiero: "Pago de reinscripción pendiente",
      tieneAdeudos: true,
    };
    expect(listAdeudoDetails(adeudos)).toEqual([
      { label: "Financiero", detail: "Pago de reinscripción pendiente" },
    ]);
  });

  it("preserves the canonical area order", () => {
    const adeudos: Adeudos = {
      ...NO_DEBTS,
      escolar: "X",
      biblioteca: "Y",
      tieneAdeudos: true,
    };
    expect(listAdeudoAreas(adeudos)).toEqual(["Biblioteca", "Escolar"]);
  });
});