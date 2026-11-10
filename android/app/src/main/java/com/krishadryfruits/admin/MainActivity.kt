package com.krishadryfruits.admin

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.work.*
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes
import com.google.android.gms.common.api.ApiException
import com.krishadryfruits.admin.databinding.ActivityMainBinding
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var backPressedTime: Long = 0
    private lateinit var googleSignInClient: GoogleSignInClient

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback != null) {
            val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }
    }

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                val email = account.email ?: ""
                val name = account.displayName ?: ""
                if (email.isNotBlank()) {
                    runOnUiThread {
                        val escapedName = name.replace("'", "\\'")
                        val js = "if (window.onNativeGoogleSignInSuccess) { window.onNativeGoogleSignInSuccess({ email: '$email', name: '$escapedName' }); }"
                        binding.webView.evaluateJavascript(js, null)
                    }
                } else {
                    notifySignInFailure("No email returned from selected Google account")
                }
            } catch (e: ApiException) {
                Log.w("GoogleAuth", "Google Sign-In failed code ${e.statusCode}: ${e.message}")
                if (e.statusCode != GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
                    notifySignInFailure("Sign in cancelled or unavailable (${e.statusCode})")
                }
            }
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val notifGranted = permissions[Manifest.permission.POST_NOTIFICATIONS] ?: true
        val locationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false

        if (notifGranted) {
            AdminFirebaseMessagingService.subscribeToOrderAlerts()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize Google Sign In for system account picker
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        requestRequiredPermissions()
        setupSwipeRefresh()
        setupWebView()
        setupPollingWorker()

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
        } else {
            AdminFirebaseMessagingService.subscribeToOrderAlerts()
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

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val ws = binding.webView.settings
        ws.javaScriptEnabled = true
        ws.domStorageEnabled = true
        ws.databaseEnabled = true
        ws.setGeolocationEnabled(true)
        ws.cacheMode = WebSettings.LOAD_DEFAULT
        ws.allowFileAccess = true
        ws.allowContentAccess = true
        ws.loadWithOverviewMode = true
        ws.useWideViewPort = true
        ws.builtInZoomControls = false
        ws.displayZoomControls = false

        // Clean User Agent so Google OAuth allows direct in-app login without disallowed_useragent or mobile blocks
        val defaultUserAgent = ws.userAgentString
        val cleanUserAgent = defaultUserAgent
            .replace("; wv", "")
            .replace("Version/4.0 ", "")
        ws.userAgentString = cleanUserAgent

        // Cookie management (preserve Clerk / Google OAuth sessions)
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(binding.webView, true)

        // Inject Native Google Auth Bridge for Android system account chooser
        binding.webView.addJavascriptInterface(AndroidAuthBridge(), "AndroidGoogleAuth")

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

                // Keep all internal krishadryfruits.in, Clerk, and Google auth inside the WebView
                if (
                    lower.contains("krishadryfruits.in") ||
                    lower.contains("google.com") ||
                    lower.contains("google.co.in") ||
                    lower.contains("gstatic.com") ||
                    lower.contains("googleapis.com") ||
                    lower.contains("clerk") ||
                    lower.contains("accounts.dev")
                ) {
                    return false
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
                // Grant geolocation directly so GPS auto-detect and map picker work inside the app
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
        }
    }

    private fun loadAdminUrl(url: String) {
        binding.webView.loadUrl(url)
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
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

    private fun setupPollingWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val periodicWork = PeriodicWorkRequestBuilder<OrderPollingWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "kdf_order_polling",
            ExistingPeriodicWorkPolicy.KEEP,
            periodicWork
        )
    }

    inner class AndroidAuthBridge {
        @JavascriptInterface
        fun isNativeApp(): Boolean = true

        @JavascriptInterface
        fun requestGoogleSignIn() {
            runOnUiThread {
                startNativeGoogleSignIn()
            }
        }

        @JavascriptInterface
        fun signOutGoogle() {
            runOnUiThread {
                googleSignInClient.signOut()
            }
        }
    }

    fun startNativeGoogleSignIn() {
        // Sign out first so Android always forces the native system account chooser dialog
        googleSignInClient.signOut().addOnCompleteListener {
            val signInIntent = googleSignInClient.signInIntent
            googleSignInLauncher.launch(signInIntent)
        }
    }

    private fun notifySignInFailure(msg: String) {
        runOnUiThread {
            val escaped = msg.replace("'", "\\'")
            val js = "if (window.onNativeGoogleSignInFailure) { window.onNativeGoogleSignInFailure('$escaped'); }"
            binding.webView.evaluateJavascript(js, null)
        }
    }
}
