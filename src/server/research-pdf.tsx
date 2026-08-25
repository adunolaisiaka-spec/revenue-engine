import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { DeepDiveContent } from "@/server/anthropic";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 18, marginBottom: 12, fontWeight: 700 },
  h2: { fontSize: 13, marginTop: 16, marginBottom: 6, fontWeight: 700 },
  p: { marginBottom: 4, lineHeight: 1.4 },
  li: { marginBottom: 3 },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

export function renderDeepDivePdf(subjectLabel: string, content: DeepDiveContent): Promise<Buffer> {
  return renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Research Brief: {subjectLabel}</Text>

        <Section title="Executive Summary">
          <Text style={styles.p}>{content.summary}</Text>
        </Section>

        <Section title="Key Findings">
          {content.keyFindings.map((f, i) => (
            <Text key={i} style={styles.li}>
              • {f.finding}
              {f.sourceUrls.length ? ` (${f.sourceUrls.join(", ")})` : ""}
            </Text>
          ))}
        </Section>

        {content.financials && (
          <Section title="Financials / Funding">
            <Text style={styles.p}>{content.financials}</Text>
          </Section>
        )}

        {content.leadership.length > 0 && (
          <Section title="Leadership">
            {content.leadership.map((l, i) => (
              <Text key={i} style={styles.li}>
                • {l.name} — {l.title}
              </Text>
            ))}
          </Section>
        )}

        {content.recentNews.length > 0 && (
          <Section title="Recent News">
            {content.recentNews.map((n, i) => (
              <Text key={i} style={styles.li}>
                • {n.headline}
                {n.url ? ` (${n.url})` : ""}
              </Text>
            ))}
          </Section>
        )}

        {content.competitors.length > 0 && (
          <Section title="Competitors">
            <Text style={styles.p}>{content.competitors.join(", ")}</Text>
          </Section>
        )}

        <Section title="Market Analysis">
          <Text style={styles.p}>{content.marketAnalysis}</Text>
        </Section>

        <Section title="Recommended Talking Points">
          {content.talkingPoints.map((t, i) => (
            <Text key={i} style={styles.li}>
              • {t}
            </Text>
          ))}
        </Section>

        {content.sources.length > 0 && (
          <Section title="Sources">
            {content.sources.map((s, i) => (
              <Text key={i} style={styles.li}>
                • {s.title} — {s.url}
              </Text>
            ))}
          </Section>
        )}
      </Page>
    </Document>
  );
}
