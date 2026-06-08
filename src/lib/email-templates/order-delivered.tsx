import React from "react";
import {
  Body,
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
import type { TemplateData, TemplateEntry } from "./registry";

interface Props {
  productName?: string;
  title?: string;
  body?: string;
  orderId?: string;
  siteUrl?: string;
}

const SITE_URL = "https://jovod.hu";

const OrderDeliveredEmail = ({
  productName = "Olvasatod",
  title,
  body,
  orderId,
  siteUrl = SITE_URL,
}: Props) => {
  const paragraphs = (body ?? "").split(/\n\n+/).filter(Boolean);
  return (
    <Html lang="hu" dir="ltr">
      <Head />
      <Preview>Elkészült a megrendelt olvasatod — {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={brand}>Jövőd.hu</Heading>
            <Text style={muted}>Elkészült az olvasatod ✨</Text>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>
              {title ?? productName}
            </Heading>
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => (
                <Text key={i} style={paragraph}>
                  {p}
                </Text>
              ))
            ) : (
              <Text style={paragraph}>A részletes olvasatot a profilodban éred el.</Text>
            )}
          </Section>

          <Section>
            <Text style={paragraph}>
              A teljes rendelésed és a korábbi olvasataid itt érhetők el:{" "}
              <Link href={`${siteUrl}/profil`} style={link}>
                {siteUrl}/profil
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Köszönjük, hogy a Jövőd.hu-t választottad.
            {orderId ? ` Rendelésazonosító: ${orderId.slice(0, 8)}.` : ""}
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
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Georgia, serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brand = { fontSize: "24px", color: "#181126", margin: "0 0 4px 0", fontWeight: 600 as const };
const muted = { color: "#6b6478", fontSize: "14px", margin: "0 0 24px 0" };
const card = {
  backgroundColor: "#faf8ff",
  border: "1px solid #e9e4f3",
  borderRadius: "12px",
  padding: "24px",
  margin: "0 0 24px 0",
};
const h2 = { fontSize: "20px", color: "#181126", margin: "0 0 12px 0" };
const paragraph = { color: "#2a2434", fontSize: "15px", lineHeight: "1.65", margin: "0 0 12px 0" };
const link = { color: "#5a3fb8", textDecoration: "underline" };
const hr = { borderColor: "#e9e4f3", margin: "24px 0" };
const footer = { color: "#9b94aa", fontSize: "12px", lineHeight: "1.5" };
