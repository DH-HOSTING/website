import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
variable: "--font-geist-sans",
subsets: ["latin"],
});

const geistMono = Geist_Mono({
variable: "--font-geist-mono",
subsets: ["latin"],
});

export const metadata: Metadata = {
title: "DH Hosting",
description:
"DH Hosting - 99.99% Uptime Guaranteed Built on redundant infrastructure so your services stay online almost all the time, with monitoring in place to catch and resolve issues fast. yeah no",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
return (
<html
lang="en"
className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
> <body className="min-h-full flex flex-col">{children}</body> </html>
);
}
