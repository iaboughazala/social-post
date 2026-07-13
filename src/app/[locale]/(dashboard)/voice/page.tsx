import { redirect } from "next/navigation";

export default async function VoiceIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/voice/topics`);
}
