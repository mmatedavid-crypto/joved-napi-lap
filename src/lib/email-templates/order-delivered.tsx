/* eslint-disable react-refresh/only-export-components */
import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { SITE_LEGAL } from "../legal";
import type { TemplateData, TemplateEntry } from "./registry";

interface Props {
  productName?: string;
  title?: string;
  body?: string;
  orderId?: string;
  accessUrl?: string;
  isGuest?: boolean;
  siteUrl?: string;
}

const SITE_URL = "https://jovod.hu";
const DOWNLOADABLE_READING_PROMISE =
  "A megnyíló oldalon az olvasatot ki is másolhatod, vagy letöltheted magadnak szöveges fájlként.";

const OrderDeliveredEmail = ({
  productName = "Olvasatod",
  title,
  body,
  orderId,
  accessUrl,
  isGuest = false,
  siteUrl = SITE_URL,
}: Props) => {
  const readingBlocks = parseReadingBlocks(body);
  const openUrl = accessUrl ?? `${siteUrl}/profil`;
  const shortOrderId = orderId ? orderId.slice(0, 8) : undefined;
  const accessIntro = isGuest
    ? "A teljes olvasatot ezen a biztonságos rendelési linken is eléred. Vendég vásárlásnál ezt a linket érdemes megtartanod."
    : "A teljes olvasatot ezen a biztonságos linken és a profilodban is eléred. Ha az emailt később keresed vissza, innen közvetlenül meg tudod nyitni.";
  const missingBodyText = isGuest
    ? "A részletes olvasatot ezen a biztonságos rendelési linken éred el. Ha a link nem nyílik meg, írj nekünk a vásárlási email címedről."
    : "A részletes olvasatot ezen a linken és a profilodban is eléred.";
  return (
    <Html lang="hu" dir="ltr">
      <Head />
      <Preview>Elkészült a megrendelt olvasatod — {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={brand}>Jövőd.hu</Heading>
            <Text style={muted}>Elkészült az olvasatod.</Text>
          </Section>

          <Section style={accessCard}>
            <Text style={accessText}>{accessIntro}</Text>
            {shortOrderId && <Text style={accessMeta}>Rendelés: {shortOrderId}</Text>}
            <Button href={openUrl} style={button}>
              Olvasat megnyitása
            </Button>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>
              {title ?? productName}
            </Heading>
            {readingBlocks.length > 0 ? (
              readingBlocks.map((block, i) => (
                <Section key={i} style={readingBlock}>
                  {block.heading && <Text style={blockHeading}>{block.heading}</Text>}
                  <Text style={paragraph}>{block.text}</Text>
                </Section>
              ))
            ) : (
              <Text style={paragraph}>{missingBodyText}</Text>
            )}
          </Section>

          <Section>
            <Text style={paragraph}>
              Az olvasatot ezen a linken bármikor újra megnyithatod:{" "}
              <Link href={openUrl} style={link}>
                olvasat megnyitása
              </Link>
            </Text>
            <Text style={paragraph}>{DOWNLOADABLE_READING_PROMISE}</Text>
            <Text style={paragraph}>
              {isGuest ? (
                <>
                  Vendég vásárlásnál ez a biztonságos rendelési link a legfontosabb hozzáférés. Fiók
                  létrehozása nem kötelező.
                </>
              ) : (
                <>
                  A profilodban a korábbi olvasataidat is megtalálod:{" "}
                  <Link href={`${siteUrl}/profil`} style={link}>
                    {siteUrl}/profil
                  </Link>
                </>
              )}
            </Text>
            <Text style={supportText}>
              Ha a gomb nem nyílik meg, írj nekünk a{" "}
              <Link href={`mailto:${SITE_LEGAL.supportEmail}`} style={link}>
                {SITE_LEGAL.supportEmail}
              </Link>{" "}
              címre. A gyorsabb segítséghez ezt add meg:{" "}
              {shortOrderId
                ? `Rendelés rövid azonosítója: ${shortOrderId}.`
                : "a vásárlási email címed."}
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Köszönjük, hogy a Jövőd.hu-t választottad. Az olvasat önismereti és szimbolikus
            tartalom, nem orvosi, jogi vagy pénzügyi tanácsadás.
            {shortOrderId ? ` Rendelés rövid azonosítója: ${shortOrderId}.` : ""}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: OrderDeliveredEmail as React.ComponentType<TemplateData>,
  subject: (data: TemplateData) => {
    const productName =
      typeof data.productName === "string" ? data.productName : "a megrendelt olvasatod";
    return `Elkészült: ${productName} — Jövőd.hu`;
  },
  displayName: "Megrendelt olvasat kézbesítve",
  previewData: {
    productName: "Három lap olvasat",
    title: "A három lap üzenete",
    body: "Az első lap a múltadról beszél — egy lezáratlan kapcsolatról.\n\nA második a jelenedet tükrözi: most érdemes lassítani.\n\nA harmadik egy nyitott ajtót mutat a közeljövőben.",
    orderId: "12345678-aaaa-bbbb-cccc-1234567890ab",
    accessUrl: "https://jovod.hu/koszonjuk?session_id=cs_test_123",
    isGuest: true,
  },
} satisfies TemplateEntry;

function parseReadingBlocks(value: string | undefined): { heading?: string; text: string }[] {
  return (value ?? "")
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [first, ...rest] = part
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (first && rest.length) {
        return { heading: first, text: rest.join("\n") };
      }
      return { text: first ?? part };
    });
}

const main = { backgroundColor: "#ffffff", fontFamily: "Georgia, serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brand = { fontSize: "24px", color: "#181126", margin: "0 0 4px 0", fontWeight: 600 as const };
const muted = { color: "#6b6478", fontSize: "14px", margin: "0 0 24px 0" };
const accessCard = {
  backgroundColor: "#181126",
  borderRadius: "12px",
  padding: "22px",
  margin: "0 0 20px 0",
};
const accessText = {
  color: "#f6f0df",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};
const accessMeta = {
  color: "#d8c282",
  fontSize: "12px",
  letterSpacing: "0.08em",
  margin: "-4px 0 16px 0",
  textTransform: "uppercase" as const,
};
const button = {
  backgroundColor: "#c9a85d",
  borderRadius: "8px",
  color: "#181126",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 700 as const,
  padding: "12px 18px",
  textDecoration: "none",
};
const card = {
  backgroundColor: "#faf8ff",
  border: "1px solid #e9e4f3",
  borderRadius: "12px",
  padding: "24px",
  margin: "0 0 24px 0",
};
const h2 = { fontSize: "20px", color: "#181126", margin: "0 0 12px 0" };
const readingBlock = { margin: "0 0 16px 0" };
const blockHeading = {
  color: "#5a3f88",
  fontSize: "13px",
  fontWeight: 700 as const,
  letterSpacing: "0.03em",
  margin: "0 0 4px 0",
};
const paragraph = { color: "#2a2434", fontSize: "15px", lineHeight: "1.65", margin: "0 0 12px 0" };
const supportText = {
  color: "#5b5368",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "4px 0 12px 0",
};
const link = { color: "#5a3fb8", textDecoration: "underline" };
const hr = { borderColor: "#e9e4f3", margin: "24px 0" };
const footer = { color: "#9b94aa", fontSize: "12px", lineHeight: "1.5" };
