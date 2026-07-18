import { DEFAULT_LANG } from "@/constants/languages";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const defaultLanguagePath = `${basePath}/${DEFAULT_LANG}/`;

// Static-friendly redirect to default language (meta refresh + client script)
export const metadata = {
  title: "Redirecting...",
  other: {
    "http-equiv:refresh": `0; url=${defaultLanguagePath}`
  }
};

export default function HomePage() {
  const target = defaultLanguagePath;
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace("${target}");`
        }}
      />
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <p style={{ padding: "2rem", textAlign: "center" }}>
        Redirecting to <a href={target}>{target}</a>...
      </p>
    </>
  );
}
