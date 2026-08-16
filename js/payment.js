/* ==================== GOOGLE PAY INTEGRATION ==================== */
window.PaymentSys = (() => {
  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
  };

  const allowedCardNetworks = ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"];
  const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

  const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: allowedCardAuthMethods,
      allowedCardNetworks: allowedCardNetworks
    }
  };

  const cardPaymentMethod = Object.assign(
    {},
    baseCardPaymentMethod,
    {
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          'gateway': 'example', // Dummy gateway for TEST environment
          'gatewayMerchantId': 'exampleGatewayMerchantId'
        }
      }
    }
  );

  let paymentsClient = null;

  function getGoogleIsReadyToPayRequest() {
    return Object.assign(
      {},
      baseRequest,
      {
        allowedPaymentMethods: [baseCardPaymentMethod]
      }
    );
  }

  function getGooglePaymentDataRequest() {
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
      merchantId: 'BCR2DN6D3LWL3PJN',
      merchantName: 'Piskola Pro'
    };
    return paymentDataRequest;
  }

  function getGooglePaymentsClient() {
    if (paymentsClient === null) {
      paymentsClient = new google.payments.api.PaymentsClient({environment: 'TEST'});
    }
    return paymentsClient;
  }

  function onGooglePayLoaded() {
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
      .then(function(response) {
        if (response.result) {
          addGooglePayButton();
        }
      })
      .catch(function(err) {
        console.error("GPay Error:", err);
      });
  }

  function addGooglePayButton() {
    const paymentsClient = getGooglePaymentsClient();
    const button = paymentsClient.createButton({
      onClick: onGooglePaymentButtonClicked,
      allowedPaymentMethods: [baseCardPaymentMethod]
    });
    const container = document.getElementById('google-pay-button-container');
    if (container) {
      container.innerHTML = '<p class="settings-note" style="margin-bottom: 6px;">Tingkatkan ke Pro untuk fitur penuh!</p>';
      container.appendChild(button);
      // Hanya tampilkan jika user belum Pro
      if (!Store.isPro()) {
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
      }
    }
  }

  function getGoogleTransactionInfo() {
    return {
      countryCode: 'ID',
      currencyCode: 'IDR',
      totalPriceStatus: 'FINAL',
      totalPrice: '15000.00' // Harga default Rp 15.000
    };
  }

  function onGooglePaymentButtonClicked() {
    const paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();

    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest)
      .then(function(paymentData) {
        processPayment(paymentData);
      })
      .catch(function(err) {
        console.error("GPay Load Error:", err);
      });
  }

  function processPayment(paymentData) {
    // Simulasi: pembayaran berhasil di frontend
    Store.setPro(true);
    alert('Terima kasih! Pembayaran berhasil. Akun Anda sekarang menjadi Piskola Pro! 🎉');
    const container = document.getElementById('google-pay-button-container');
    if (container) container.style.display = 'none';
  }

  return { onGooglePayLoaded };
})();

// Load listener
window.addEventListener('load', () => {
  if (typeof google !== 'undefined' && google.payments) {
    PaymentSys.onGooglePayLoaded();
  } else {
    let attempts = 0;
    const i = setInterval(() => {
      if (typeof google !== 'undefined' && google.payments) {
        clearInterval(i);
        PaymentSys.onGooglePayLoaded();
      } else if (attempts++ > 20) {
        clearInterval(i);
      }
    }, 500);
  }
});
