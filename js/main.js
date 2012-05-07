var gAcctNumber = 2;
var gDynamicGrammarRootUrl = location.href.replace("/content/", "/perl/") + "grammars/dynamicgram.pl";
var gMerchantDelim = "<DELIM>";

//-----------------------------------------------------------------------------

function getUrlVar(name) {
  var vars = [], hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    if (hash[0] == name) {
      return hash[1];
    }
  }
  return null;
}

//-----------------------------------------------------------------------------

function load() {
  AccountData.account.setDefaultPaymentDates();
  AccountData.account.setDefaultPayment();
  NativeBridge.onInitialize(nbInitialize);
}

function nbInitialize(o) {
}

function emptyGrammarHandler(result) {
}

//-----------------------------------------------------------------------------

var mainmenu_prompted = false;
var mainmenu_reco_errors = 0;

function mainmenu_grammar() {
  return "grammars/mainmenu.grxml";
}

function mainmenu_beforeshow() {
  AccountData.account.init(gAcctNumber);
  AccountData.account.initDropdown('last-4-digits-main', false, function(dropdown, data) {
    // Callback sets up onchange handler for dropdown
    dropdown.on('change', function () {
    });

    // Initiate onchange event
    dropdown.change();
  });
}

function mainmenu_show() {
  mainmenu_reco_errors = 0;
  NativeBridge.setMessage("How can I help you?");
  NativeBridge.setGrammar(mainmenu_grammar(), null, mainmenu_grammarHandler);
  if (!mainmenu_prompted) {
    NativeBridge.playAudio("audio/RT_Menu_01.wav");
    mainmenu_prompted = true;
  }
}

function mainmenu_beforehide() {
  NativeBridge.cancelAudio();
}

function mainmenu_grammarHandler(result) {
    if (result == null || result.length == 0) {
        NativeBridge.playAudio("audio/sorry.wav");
        NativeBridge.setMessage("What?");
        NativeBridge.setGrammar(mainmenu_grammar(), null, mainmenu_grammarHandler);
    } else {
        var interpretation = result[0].interpretation;
        NativeBridge.setMessage(interpretation);
        if (interpretation == 'payment') {
            $.mobile.changePage("#payment");
        }
    }
}



//-----------------------------------------------------------------------------

var payment_prompted = false;
var payment_reco_errors = 0;

function payment_grammar() {
  return "grammars/make_payment.grxml";
}

function payment_beforeshow() {
  NativeBridge.setMessage(null);
  AccountData.account.init(gAcctNumber);
 
  AccountData.account.initDropdown('last-4-digits-payment', false, function(dropdown, data) {
    // Callback sets up onchange handler for dropdown
    dropdown.on('change', function () {
 //       alert("test");
    });

    // Initiate onchange event
    dropdown.change();
  });

  AccountData.account.initAcctDropdown('list-acctfrom', false, function(list, data) {
          //        alert("test");
  });

  AccountData.account.initPmtOptsDropdown("list-payment-amount", false, function(list, data) {
      
  });
  $('#datebox').hide();
/*
// $('#pmtdatehidden').datebox('open');
   $('#pmtdatehidden').bind('datebox', function(e,p) {
           alert(p.method);
           alert(e[0]);
      if ( p.method === 'dooffset' ) {
         $('#pmtdatehidden').datebox('close');
      }
   });
   */
}

function payment_show() {
  payment_reco_errors = 0;
//  NativeBridge.setMessage(null);
  NativeBridge.setGrammar(payment_grammar(), null, payment_grammarHandler);
  if (!payment_prompted) {
    NativeBridge.playAudio("audio/RT_Menu_01.wav");
    payment_prompted = true;
  }
}

function payment_beforehide() {
  NativeBridge.cancelAudio();
}

function payment_grammarHandler(result) {

    if (result == null || result.length == 0) {
        NativeBridge.playAudio("audio/sorry.wav");
        NativeBridge.setMessage("What?");
        //    NativeBridge.playTTS("male", "I'm sorry, could you repeat that?");
        NativeBridge.setGrammar(payment_grammar(), null, payment_grammarHandler);
    } else {
        var interpretation = result[0].interpretation;
        var action = interpretation.SLOTS.action;
        var date1 = "";
        var amount = "";
        var source = "";
        var destination = "";

        if (action == 'pay') {
            amount = interpretation.SLOTS.amount;
            source = interpretation.SLOTS.source;
            destination = interpretation.SLOTS.destination;
            date1 = interpretation.SLOTS.date;

            if (amount == "none" && date == "none" && source == "none" && destination == "none") {
                $.mobile.changePage("#confirm");
            }
            else {
                if (date1 != "none") {
                    //convert the date string to friendly format
                    var datearr = date1.split('/');
                    // TODO still need to process relative date (i.e. tomorrow)
                    // skip for now
                    if (datearr.length > 1) {
                        var month1 = month[ datearr[0] - 1]; 
                        var dom1 =  datearr[1];
                        var year1;
                        if (datearr.length > 2) {
                            year1 = datearr[2];
                        }
                        else {
                            var currdate = new Date();
                            year1 = currdate.getFullYear();
                        }
                        $('#pmtdate').val(month1 + " " + dom1 + ", " + year1);
                        AccountData.account.updateEstDate();
                    }
                }
                if (source != "none") {
                    // set the new active source account
                    // and then refresh the list
                    AccountData.account.set_active_src_number(source);
                    AccountData.account.refresh_src_dropdown('list-acctfrom');
                }
                if (destination != "none") {
                    //_active_cc_number = destination
                    // set the new active dest account
                    // and then refresh the list
                    AccountData.account.set_active_cc_number(destination);
                    AccountData.account.refresh_cc_dropdown('last-4-digits-payment');
                }
                //handle the actual dollar amount last so it can overwrite any changes
                // made by the dropdown refreshes
                amount = interpretation.SLOTS.amount;
                if (amount == "current_balance") {
                    amount = AccountData.account.get_current_balance();
                //   $('#pmtamount').val(AccountData.account.get_current_balance());
                }
                else if (amount == "minimum_due") {
                    amount = AccountData.account.get_minimum_payment();
                //    $('#pmtamount').val(AccountData.account.get_minimum_payment());
                }
                else {
//                    $('#pmtamount').val(amount);
                }
                $('#pmtamount').val(CurrencyFormatted(amount));
                
            }
        }
/*
        else if (action == 'changesource') {
            if (source == 'checking') {
                setAcct(0, FROM_TYPE);
            } else if (source == 'savings') {
                setAcct(1, FROM_TYPE);
            }
        }
        else if (action == 'changedestination') {
            if (destination == 'platinum') {
                setAcct(0, TO_TYPE);
            } else if (destination == 'gold') {
                setAcct(1, TO_TYPE);
            } else if (destination == 'rewards') {
                setAcct(2, TO_TYPE);
            }
        }
*/
        else if (action == 'addsource') {
            $.mobile.changePage("#acct_add");
        }
    }
}

//-----------------------------------------------------------------------------

var acctfrom_prompted = false;
var acctfrom_reco_errors = 0;

function acctfrom_grammar() {
    return "grammars/payment_src.grxml";
    //  return gDynamicGrammarRootUrl + "?type=mainmenu&merchants=" + merchants();
}

function acctfrom_beforeshow() {
    //  AccountData.account.init(gAcctNumber);
    AccountData.account.initDropdown('last-4-digits-acctfrom', false, function(dropdown, data) {
            // Callback sets up onchange handler for dropdown
            dropdown.on('change', function () {
                //   TransactionList.init();
                //  TO DO  Instead of updating transaction list, update the menu entries
                });

            // Initiate onchange event
            dropdown.change();
            });

    //TransactionList.clear_filters();
}

function acctfrom_show() {
  mainmenu_reco_errors = 0;
  NativeBridge.setMessage("How can I help you?");
  NativeBridge.setGrammar(acctfrom_grammar(), null, acctfrom_grammarHandler);
  if (!acctfrom_prompted) {
    NativeBridge.playAudio("audio/RT_Menu_01.wav");
    acctfrom_prompted = true;
  }
}

function acctfrom_beforehide() {
  NativeBridge.cancelAudio();
}

function acctfrom_grammarHandler(result) {
}

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------


var acctadd_prompted = false;
var acctadd_reco_errors = 0;

function acctadd_grammar() {
    return "grammars/add_account.grxml";
}

function acctadd_beforeshow() {
    NativeBridge.setMessage(null);
    AccountData.account.initDropdown('last-4-digits-acctadd', true, function(dropdown, data) {
            // Callback sets up onchange handler for dropdown
            dropdown.on('change', function () {
                //  TO DO  Instead of updating transaction list, update the menu entries
                });

            // Initiate onchange event
            dropdown.change();
            });
}

function acctadd_show() {
  acctadd_reco_errors = 0;
  NativeBridge.setGrammar(acctadd_grammar(), null, acctadd_grammarHandler);
  if (!acctadd_prompted) {
//    NativeBridge.playAudio("audio/RT_Menu_01.wav");
    acctadd_prompted = true;
  }
}

function acctadd_beforehide() {
  NativeBridge.cancelAudio();
}

function acctadd_grammarHandler(result) {
    if (result == null || result.length == 0) {
        NativeBridge.playAudio("audio/sorry.wav");
        NativeBridge.setMessage("What?");
        NativeBridge.setGrammar("grammars/add_account.grxml", null, addacct_grammarHandler);
    } else {
        var interpretation = result[0].interpretation;
        var action = interpretation.SLOTS.action;
        var number = "";
        if (action == 'submit') {
            add_acct();
        } else if (action == "addroutingnumber") {
            number = interpretation.SLOTS.number;
            // TODO -  should be setting withing Account obj 
            $("#newacctrouting").val(number);
            NativeBridge.setGrammar("grammars/add_account.grxml", null, addacct_grammarHandler);
        } else if (action == "addaccountnumber") {
            number = interpretation.SLOTS.number;
            // TODO -  should be setting withing Account obj
            $("#newacctnumber").val(number);
            NativeBridge.setGrammar("grammars/add_account.grxml", null, addacct_grammarHandler);
        }
    }
}

function add_acct() {
    var result = AccountData.account.addAcct();
    if (result == 1) {
        NativeBridge.setGrammar("grammars/add_account.grxml", null, acctadd_grammarHandler);
        NativeBridge.setMessage("Invalid routing number");
    } 
    else if (result == 2) {
        NativeBridge.setGrammar("grammars/add_account.grxml", null, acctadd_grammarHandler);
        NativeBridge.setMessage("Invalid account number");
    }
    else {
        $.mobile.changePage($("#payment"));
    }
}



//-----------------------------------------------------------------------------

function confirm_beforeshow() {
    AccountData.account.createConfirmationMsg();
    AccountData.account.initDropdown('last-4-digits-confirm', true, function(dropdown, data) {
            // Callback sets up onchange handler for dropdown
            dropdown.on('change', function () {
                //  TO DO  Instead of updating transaction list, update the menu entries
                });

            // Initiate onchange event
            dropdown.change();
            });
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------





var recenttransactions_prompted = false;
var recenttransactions_reco_errors = 0;

function recenttransactions_grammar() {
  return gDynamicGrammarRootUrl + "?type=recenttransactions&merchants=" + merchants();
}

function recenttransactions_beforeshow() {
  recenttransactions_reco_errors = 0;
  NativeBridge.setMessage(null);
  NativeBridge.setGrammar(recenttransactions_grammar(), null, recenttransactions_grammarHandler);
}

function recenttransactions_show() {
  if (!recenttransactions_prompted) {
    NativeBridge.playAudio("audio/RT_RecentTransactions_01.wav");
    
    recenttransactions_prompted = true;
  }
  AccountData.account.init(gAcctNumber);
  recenttransactions_dropdown();
  $('#charges-list').listview('refresh');
}

function recenttransactions_dropdown() {
  AccountData.account.initDropdown('last-4-digits', false, function(dropdown, results) {
    // Callback sets up onchange handler for dropdown
    dropdown.on('change', function () {
        TransactionList.init();
    });

    // Initiate onchange event
    dropdown.change();
});
}

function recenttransactions_beforehide() {
  NativeBridge.cancelAudio();
}

function recenttransactions_grammarHandler(result) {
  if (result != null && result.length > 0) {
    var interp = result[0].interpretation;
    var action = interp.action.toLowerCase();
    NativeBridge.log("recenttransactions_grammarHandler - reco result: " + action);

    if (action == "sort") {
      NativeBridge.log("recenttransactions_grammarHandler - sort" +
                       ", field: " + interp.field + 
                       ", order: " + interp.order);
      
      recenttransactions_reco_errors = 0;
      TransactionList.sort(interp.field.toLowerCase(), interp.order.toLowerCase());
      NativeBridge.setGrammar(recenttransactions_grammar(), null, recenttransactions_grammarHandler);

    } else if (action == "filter") {
      NativeBridge.log("recenttransactions_grammarHandler - filter" +
                       ", field: " + interp.field + 
                       ", comparison: " + interp.comparison +
                       ", value: " + interp.value);

      var field = interp.field.toLowerCase();

      if (field == "date") {
        var date = new Date(parseFloat(interp.value));
        NativeBridge.log("recenttransactions_grammarHandler - date: " + date.toLocaleString());
        TransactionList.filter_by_date(parseFloat(interp.value), interp.comparison.toLowerCase());

      } else if (field == "merchant") {
        TransactionList.filter_by_merchant(interp.value);

      } else if (field == "amount") {
        TransactionList.filter_by_amount(interp.value, interp.comparison.toLowerCase());
      }

      recenttransactions_reco_errors = 0;
      NativeBridge.setGrammar(recenttransactions_grammar(), null, recenttransactions_grammarHandler);

    } else if (action == "detail") {
      NativeBridge.log("recenttransactions_grammarHandler - detail" +
                       ", idx: " + interp.idx);

      recenttransactions_reco_errors = 0;
      TransactionList.show_transaction(parseInt(interp.idx));
      $.mobile.changePage($("#transaction-detail"));

    } else if (action == "chat") {
      recenttransactions_reco_errors = 0;
      $.mobile.changePage($("#chat"));

    } else {
      recenttransactions_reco_errors++;
      NativeBridge.log("recenttransactions_grammarHandler - unhandled:" + action + ".");
    }
  } else {
    recenttransactions_reco_errors++;
    NativeBridge.log("recenttransactions_grammarHandler - no reco result.");
  }

  NativeBridge.log("recenttransactions_grammarHandler - recenttransactions_reco_errors: " + recenttransactions_reco_errors);
  if (recenttransactions_reco_errors > 0) {
    NativeBridge.setGrammar(recenttransactions_grammar(), null, recenttransactions_grammarHandler);
    if (recenttransactions_reco_errors == 1) {
      NativeBridge.playAudio("audio/RT_RecentTransactions_02.wav");
    } else {
      NativeBridge.playAudio("audio/RT_RecentTransactions_03.wav");
    }
  }
}

//-----------------------------------------------------------------------------

var transactiondetail_prompted = false;
var transactiondetail_reco_errors = 0;

function detail_init(dropdown_container_id) {
  var pages = ['#transaction-detail', '#payment-detail'];
  var page = location.hash.replace(/\?.*/, '');
  if ($.inArray(page, pages) > -1) {
    var index = getUrlVar('index');
    var transaction_id = getUrlVar("transaction_id");

    AccountData.account.init(gAcctNumber);
    AccountData.account.initDropdown(dropdown_container_id, true);
    var cc_number = AccountData.account.active_cc_number();

    $("#dispute-button").attr("href", "#dispute?cc_number=" + cc_number + "&transaction_id=" + transaction_id);
    TransactionList.show_transaction(index);
  }
}

function transactiondetail_beforeshow() {
  detail_init('last-4-digits-detail');

  transactiondetail_reco_errors = 0;
  NativeBridge.setMessage(null);
  NativeBridge.setGrammar("grammars/transactiondetail.grxml", null, transactiondetail_grammarHandler);
}

function transactiondetail_show() {
  if (!transactiondetail_prompted) {
    NativeBridge.playAudio("audio/RT_TransactionDetails_01.wav");
    transactiondetail_prompted = true;
  }
}

function transactiondetail_beforehide() {
  NativeBridge.cancelAudio();
  return false;
}

function transactiondetail_grammarHandler(result) {
  if (result != null && result.length > 0) {
    var interp = result[0].interpretation.toLowerCase();
    NativeBridge.log("transactiondetail_grammarHandler - reco result: " + interp);

    if (interp == "dispute") {
      transactiondetail_reco_errors = 0;
      $.mobile.changePage($("#dispute"));

    } else if (interp == "next") {
      transactiondetail_reco_errors = 0;
      NativeBridge.setGrammar("grammars/transactiondetail.grxml", null, transactiondetail_grammarHandler);
      TransactionList.show_next_transaction();

    } else if (interp == "previous") {
      transactiondetail_reco_errors = 0;
      NativeBridge.setGrammar("grammars/transactiondetail.grxml", null, transactiondetail_grammarHandler);
      TransactionList.show_prev_transaction();

    } else if (interp == "back to list") {
      transactiondetail_reco_errors = 0;
      $.mobile.changePage($("#recent-transactions"));

    } else if (interp == "chat") {
      transactiondetail_reco_errors = 0;
      $.mobile.changePage($("#chat"));

    } else {
      transactiondetail_reco_errors++;
      NativeBridge.log("transactiondetail_grammarHandler - unhandled:" + interp + ".");
    }
  } else {
    transactiondetail_reco_errors++;
    NativeBridge.log("transactiondetail_grammarHandler - no reco result.");
  }

  NativeBridge.log("transactiondetail_grammarHandler - transactiondetail_reco_errors: " + transactiondetail_reco_errors);
  if (transactiondetail_reco_errors > 0) {
    NativeBridge.setGrammar("grammars/transactiondetail.grxml", null, transactiondetail_grammarHandler);
    if (transactiondetail_reco_errors == 1) {
      NativeBridge.playAudio("audio/RT_TransactionDetails_02.wav");
    } else {
      NativeBridge.playAudio("audio/RT_TransactionDetails_03.wav");
    }
  }
}

function paymentdetail_init() {
  detail_init('last-4-digits-detail-payment');
}

//-----------------------------------------------------------------------------

var dispute_reco_errors = 0;

function dispute_beforeshow() {
  dispute_reco_errors = 0;
  NativeBridge.setMessage(null);
  NativeBridge.setGrammar("grammars/dispute.grxml", null, dispute_grammarHandler);

  AccountData.account.init(gAcctNumber);
  AccountData.account.initDropdown('last-4-digits-dispute', true);
}

function dispute_grammarHandler(result) {
  if (result != null && result.length > 0) {
    var interp = result[0].interpretation.toLowerCase();
    NativeBridge.log("dispute_grammarHandler - reco result: " + interp);

    if (interp == "back to list") {
      dispute_reco_errors = 0;
      $.mobile.changePage($("#recent-transactions"));

    } else if (interp == "main menu") {
      dispute_reco_errors = 0;
      $.mobile.changePage($("#main-menu"));

    } else if (interp == "continue") {
      dispute_reco_errors = 0;
      $.mobile.changePage($("#survey"));

    } else if (interp == "chat") {
      dispute_reco_errors = 0;
      $.mobile.changePage($("#chat"));

    } else {
      dispute_reco_errors++;
      NativeBridge.log("dispute_grammarHandler - unhandled:" + interp + ".");
    }
  } else {
    dispute_reco_errors++;
    NativeBridge.log("dispute_grammarHandler - no reco result.");
  }

  NativeBridge.log("dispute_grammarHandler - dispute_reco_errors: " + dispute_reco_errors);
  if (dispute_reco_errors > 0) {
    NativeBridge.setGrammar("grammars/dispute.grxml", null, dispute_grammarHandler);
  }
}

//-----------------------------------------------------------------------------

var survey_reco_errors = 0;

function survey_beforeshow() {
  survey_reco_errors = 0;
  NativeBridge.setMessage(null);
  //NativeBridge.setGrammar("grammars/survey.grxml", null, survey_grammarHandler);
  NativeBridge.setGrammar(null, null, emptyGrammarHandler);

  AccountData.account.init(gAcctNumber);
  AccountData.account.initDropdown('last-4-digits-dispute', true);
}

function survey_grammarHandler(result) {
  if (result != null && result.length > 0) {
    var interp = result[0].interpretation.toLowerCase();
    NativeBridge.log("survey_grammarHandler - reco result: " + interp);

    if (interp == "main menu") {
      survey_reco_errors = 0;
      $.mobile.changePage($("#main-menu"));

    } else if (interp == "submit") {
      // just make it go to the main menu for now
      survey_reco_errors = 0;
      $.mobile.changePage($("#main-menu"));

    } else if (interp == "chat") {
      survey_reco_errors = 0;
      $.mobile.changePage($("#chat"));

    } else {
      survey_reco_errors++;
      NativeBridge.log("survey_grammarHandler - unhandled:" + interp + ".");
    }
  } else {
    survey_reco_errors++;
    NativeBridge.log("survey_grammarHandler - no reco result.");
  }

  NativeBridge.log("survey_grammarHandler - survey_reco_errors: " + survey_reco_errors);
  if (survey_reco_errors > 0) {
    NativeBridge.setGrammar("grammars/survey.grxml", null, survey_grammarHandler);
  }
}

function survey_onshow() {
  $('#survey-feedback').focus();
}

function survey_doStar(vid){
  if (vid == 0 && !$('li > span').hasClass('star-act')) {
    if ($('#s-'+vid).hasClass('star')) {
      $('#s-'+vid).removeClass('star').addClass('star-act');
    } else {
      $('#s-'+vid).removeClass('star-act').addClass('star');
    }
  } else {
    for (var i = vid; i < 5; i++) {
      if ($('#s-'+i).hasClass('star-act')) {
        $('#s-'+i).removeClass('star-act').addClass('star');
      }
    }
    for (var i = 0; i < 5; i++){
      $('#s-'+i).removeClass('star').addClass('star-act');
      if (i == vid) {
        break;
      }
    }
  }
}

//-----------------------------------------------------------------------------

function chat_show() {
  NativeBridge.setMessage(null);
  NativeBridge.setGrammar(null, null, emptyGrammarHandler);
}
