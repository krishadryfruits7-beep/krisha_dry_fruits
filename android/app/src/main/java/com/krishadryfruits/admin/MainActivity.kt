package com.krishadryfruits.admin

import android.Manifest
import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.krishadryfruits.admin.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var backPressedTime: Long = 0

    companion object {
        // Standard modern mobile Chrome User-Agent string to satisfy Google OAuth and Web Standards
        const val MOBILE_CHROME_UA = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
    }

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback != null) {
            val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val notifGranted = permissions[Manifest.permission.POST_NOTIFICATIONS] ?: true
        val prefs = getSharedPreferences(AdminFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
        if (notifGranted && prefs.getBoolean(AdminFirebaseMessagingService.KEY_IS_ADMIN_AUTHENTICATED, false)) {
            AdminFirebaseMessagingService.subscribeToOrderAlerts(this)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        requestRequiredPermissions()
        setupSwipeRefresh()
        setupWebView()

        // Handle navigation target from push notification or default to /admin
        val targetUrl = intent?.getStringExtra("targetUrl") ?: getString(R.string.admin_url)
        loadAdminUrl(targetUrl)

        setupBackNavigation()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val targetUrl = intent.getStringExtra("targetUrl")
        if (!targetUrl.isNullOrBlank()) {
            loadAdminUrl(targetUrl)
        }
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setColorSchemeResources(
            R.color.brand_primary,
            R.color.brand_gold
        )
        binding.swipeRefresh.setOnRefreshListener {
            binding.webView.reload()
        }

        binding.btnRetry.setOnClickListener {
            binding.layoutError.visibility = View.GONE
            binding.swipeRefresh.visibility = View.VISIBLE
            binding.webView.reload()
        }
    }

    inner class AdminBridge {
        @JavascriptInterface
        fun onAdminAuthenticated(email: String) {
            runOnUiThread {
                AdminFirebaseMessagingService.subscribeToOrderAlerts(this@MainActivity)
                Toast.makeText(this@MainActivity, "Admin authenticated: $email", Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun onAdminLoggedOut() {
            runOnUiThread {
                AdminFirebaseMessagingService.unsubscribeFromOrderAlerts(this@MainActivity)
            }
        }

        @JavascriptInterface
        fun isAndroidApp(): Boolean = true
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val ws = binding.webView.settings
        ws.javaScriptEnabled = true
        ws.domStorageEnabled = true
        ws.databaseEnabled = true
        ws.setGeolocationEnabled(true)
        ws.cacheMode = WebSettings.LOAD_DEFAULT
        ws.allowFileAccess = false
        ws.allowContentAccess = false
        ws.loadWithOverviewMode = true
        ws.useWideViewPort = true
        ws.builtInZoomControls = false
        ws.displayZoomControls = false
        ws.javaScriptCanOpenWindowsAutomatically = true
        ws.setSupportMultipleWindows(true)

        // Clean User Agent so Google OAuth sees standard modern Chrome browser
        ws.userAgentString = MOBILE_CHROME_UA

        // Suppress X-Requested-With header on all origins so Google OAuth does not block request
        if (WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST)) {
            WebSettingsCompat.setRequestedWithHeaderOriginAllowList(ws, emptySet())
        }

        // Cookie management (preserve Clerk / Google OAuth sessions)
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(binding.webView, true)

        binding.webView.addJavascriptInterface(AdminBridge(), "AndroidBridge")

        binding.webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.progressBar.visibility = View.VISIBLE
                binding.layoutError.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
                cookieManager.flush()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    binding.swipeRefresh.visibility = View.GONE
                    binding.layoutError.visibility = View.VISIBLE
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                val lower = url.lowercase()

                // If user clicks a link to public storefront, redirect them strictly back to /admin
                // (User requirement: APK is exclusively for the admin console)
                if (lower == "https://krishadryfruits.in/" || lower == "https://krishadryfruits.in" || lower.startsWith("https://krishadryfruits.in/?") || lower.startsWith("https://krishadryfruits.in/#")) {
                    binding.webView.loadUrl(getString(R.string.admin_url))
                    return true
                }

                // Keep all internal Krisha admin URLs, Clerk auth, and Google auth inside the WebView
                if (
                    lower.contains("krishadryfruits.in/admin") ||
                    lower.contains("google.com") ||
                    lower.contains("google.co.in") ||
                    lower.contains("gstatic.com") ||
                    lower.contains("googleapis.com") ||
                    lower.contains("clerk") ||
                    lower.contains("accounts.dev")
                ) {
                    return false
                }

                // If navigation tries to leave /admin to other pages of krishadryfruits.in
                if (lower.contains("krishadryfruits.in")) {
                    binding.webView.loadUrl(getString(R.string.admin_url))
                    return true
                }

                // External intents: Phone calls, WhatsApp, external Maps navigation
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    true
                } catch (e: Exception) {
                    false
                }
            }
        }

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                binding.progressBar.progress = newProgress
                if (newProgress >= 100) {
                    binding.progressBar.visibility = View.GONE
                }
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                }

                return try {
                    filePickerLauncher.launch(intent)
                    true
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    false
                }
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?
            ): Boolean {
                val dialog = Dialog(this@MainActivity, android.R.style.Theme_DeviceDefault_Light_NoActionBar_Fullscreen)
                val popupWebView = WebView(this@MainActivity).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }

                val popupWs = popupWebView.settings
                popupWs.javaScriptEnabled = true
                popupWs.domStorageEnabled = true
                popupWs.userAgentString = MOBILE_CHROME_UA

                if (WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST)) {
                    WebSettingsCompat.setRequestedWithHeaderOriginAllowList(popupWs, emptySet())
                }

                CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true)

                popupWebView.webChromeClient = object : WebChromeClient() {
                    override fun onCloseWindow(window: WebView?) {
                        try {
                            dialog.dismiss()
                        } catch (_: Exception) {}
                        binding.webView.reload()
                    }
                }

                popupWebView.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(v: WebView?, url: String?) {
                        super.onPageFinished(v, url)
                        CookieManager.getInstance().flush()
                        // If OAuth completed and redirects back to our admin page
                        if (url?.contains("krishadryfruits.in/admin") == true && !url.contains("oauth")) {
                            try {
                                dialog.dismiss()
                            } catch (_: Exception) {}
                            binding.webView.loadUrl(url)
                        }
                    }
                }

                dialog.setContentView(popupWebView)
                dialog.setOnDismissListener {
                    try {
                        popupWebView.destroy()
                    } catch (_: Exception) {}
                }
                dialog.show()

                val transport = resultMsg?.obj as? WebView.WebViewTransport
                transport?.webView = popupWebView
                resultMsg?.sendToTarget()
                return true
            }
        }
    }

    private fun loadAdminUrl(url: String) {
        // Enforce admin url
        val target = if (url.contains("/admin")) url else getString(R.string.admin_url)
        binding.webView.loadUrl(target)
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val currentUrl = binding.webView.url ?: ""
                if (!currentUrl.contains("/admin")) {
                    binding.webView.loadUrl(getString(R.string.admin_url))
                    return
                }

                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    if (backPressedTime + 2000 > System.currentTimeMillis()) {
                        finish()
                    } else {
                        Toast.makeText(this@MainActivity, "Press back again to exit Krisha Admin", Toast.LENGTH_SHORT).show()
                        backPressedTime = System.currentTimeMillis()
                    }
                }
            }
        })
    }
}
