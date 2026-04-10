import Script from "next/script";

export function TrackingScripts() {
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <>
      {/* Klaviyo — runs in all environments */}
      <Script
        src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=R9Egnm"
        strategy="lazyOnload"
      />

      {/* Production-only scripts */}
      {isProduction && (
        <>
          {/* Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=GT-MR57S2GV"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag("set","linker",{"domains":["www.theregenerativetourism.com"]});
              gtag("js", new Date());
              gtag("set", "developer_id.dZTNiMT", true);
              gtag("config", "GT-MR57S2GV", {"googlesitekit_post_type":"page"});
            `}
          </Script>

          {/* Meta Pixel */}
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){
              if(f.fbq)return;
              n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];
              t=b.createElement(e);t.async=!0;
              t.src=v;
              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
              }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1521994408783354');
              fbq('track', 'PageView');
            `}
          </Script>

          {/* Google AdSense */}
          <Script
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5857219935897396&host=ca-host-pub-2644536267352236"
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />

          {/* Microsoft Clarity */}
          <Script id="microsoft-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "w9m403j01b");
            `}
          </Script>
        </>
      )}
    </>
  );
}
