"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const ACCENT = "#1A3A5C";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

type AdSummary = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  status: string;
  paymentStatus: string;
  location: { storeName: string; slug: string };
};

// ─── PayPal script loader ─────────────────────────────────────────────────────
function loadPayPalScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).paypal) { resolve(); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const adId = params.id as string;

  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";
  const sessionId = searchParams.get("session_id");

  const [ad, setAd] = useState<AdSummary | null>(null);
  const [adLoading, setAdLoading] = useState(true);
  const [error, setError] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalContainerId] = useState("paypal-button-container");
  const [paypalMounted, setPaypalMounted] = useState(false);

  // Fetch ad details
  useEffect(() => {
    fetch(`/api/ads/${adId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAd(json.data);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load ad"))
      .finally(() => setAdLoading(false));
  }, [adId]);

  // Confirm Stripe payment on success redirect (fallback if webhook was delayed)
  useEffect(() => {
    if (!success || !sessionId || !adId) return;
    fetch("/api/payments/stripe/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, adId }),
    }).catch(console.error);
  }, [success, sessionId, adId]);

  // Load PayPal script when we have an unpaid ad
  useEffect(() => {
    if (!ad || ad.paymentStatus !== "unpaid" || !PAYPAL_CLIENT_ID || success) return;
    loadPayPalScript()
      .then(() => setPaypalReady(true))
      .catch(() => console.warn("PayPal SDK failed to load"));
  }, [ad, success]);

  // Mount PayPal buttons once SDK is ready and container exists
  useEffect(() => {
    if (!paypalReady || paypalMounted || !ad) return;
    const container = document.getElementById(paypalContainerId);
    if (!container) return;

    setPaypalMounted(true);
    (window as any).paypal.Buttons({
      createOrder: async () => {
        const res = await fetch("/api/payments/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data.orderId;
      },
      onApprove: async (data: { orderID: string }) => {
        setPayLoading(true);
        try {
          const res = await fetch("/api/payments/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adId, orderId: data.orderID }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
          router.push(`/ads/${adId}/payment?success=true`);
        } catch (e: any) {
          setError(e.message || "PayPal capture failed");
          setPayLoading(false);
        }
      },
      onError: (err: any) => {
        console.error("PayPal error", err);
        setError("PayPal encountered an error. Please try again.");
      },
    }).render(`#${paypalContainerId}`);
  }, [paypalReady, paypalMounted, ad, adId, paypalContainerId, router]);

  // ─── Stripe checkout ─────────────────────────────────────────────────────────
  const handleStripeCheckout = async () => {
    setPayLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      window.location.href = json.data.url;
    } catch (e: any) {
      setError(e.message || "Stripe checkout failed");
      setPayLoading(false);
    }
  };

  // ─── Success state ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: 48, maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, color: ACCENT, marginBottom: 8 }}>Payment received!</h1>
          <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 24 }}>
            Your ad has been submitted for review. You'll receive an email once it's approved (typically within 1–2 business days).
          </p>
          <a
            href="/dashboard/user"
            style={{ display: "inline-block", background: ACCENT, color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}
          >
            View My Ads
          </a>
        </div>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (adLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6B8FA8", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (!ad) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#b91c1c" }}>{error || "Ad not found"}</p>
      </div>
    );
  }

  // ─── Already paid ─────────────────────────────────────────────────────────────
  if (ad.paymentStatus === "paid") {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: 48, maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: ACCENT, marginBottom: 8 }}>Already paid</h2>
          <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 24 }}>This ad has been paid and is pending review.</p>
          <a href="/dashboard/user" style={{ display: "inline-block", background: ACCENT, color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            View My Ads
          </a>
        </div>
      </div>
    );
  }

  // ─── Payment form ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <a href="/dashboard/user" style={{ fontSize: 13, color: "#6B8FA8", textDecoration: "none", marginBottom: 24, display: "inline-block" }}>
          ← Back to dashboard
        </a>

        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>
          Complete Payment
        </h1>
        <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
          Your ad will be submitted for review once payment is confirmed.
        </p>

        {/* Ad summary card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <img
              src={ad.imageUrl}
              alt={ad.title}
              style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: ACCENT, marginBottom: 2 }}>{ad.title}</div>
              <div style={{ fontSize: 12, color: "#6B8FA8" }}>{ad.location.storeName} · 1-week display</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#E8563A", flexShrink: 0 }}>$100</div>
          </div>
        </div>

        {cancelled && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#854d0e" }}>
            Payment was cancelled. You can try again below.
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#b91c1c" }}>
            {error}
          </div>
        )}

        {/* Payment options */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: 32 }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, marginBottom: 24 }}>Choose payment method</h2>

          {/* Stripe */}
          <div style={{ marginBottom: 24, padding: 20, border: "1px solid #D8E4EE", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>💳</span>
              <span style={{ fontWeight: 600, color: ACCENT }}>Credit / Debit Card</span>
              <span style={{ fontSize: 11, background: "#E8EFF6", color: "#6B8FA8", padding: "2px 8px", borderRadius: 4 }}>via Stripe</span>
            </div>
            <p style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 16 }}>
              Securely pay with any major card. You'll be redirected to Stripe's secure checkout.
            </p>
            <button
              onClick={handleStripeCheckout}
              disabled={payLoading}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "#635BFF",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: payLoading ? "not-allowed" : "pointer",
                opacity: payLoading ? 0.7 : 1,
              }}
            >
              {payLoading ? "Redirecting…" : "Pay $100.00 with Stripe →"}
            </button>
          </div>

          {/* PayPal */}
          <div style={{ padding: 20, border: "1px solid #D8E4EE", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>🅿️</span>
              <span style={{ fontWeight: 600, color: ACCENT }}>PayPal</span>
            </div>
            <p style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 16 }}>
              Pay using your PayPal account or PayPal-supported cards.
            </p>
            <div id={paypalContainerId}>
              {!paypalReady && PAYPAL_CLIENT_ID && (
                <div style={{ textAlign: "center", padding: 16, color: "#6B8FA8", fontSize: 13 }}>
                  Loading PayPal…
                </div>
              )}
              {!PAYPAL_CLIENT_ID && (
                <div style={{ textAlign: "center", padding: 16, color: "#6B8FA8", fontSize: 13 }}>
                  PayPal is not configured for this environment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
