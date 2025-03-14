

  # CGI script that creates a fill-out form
  # and echoes back its values.
# used to test both CGI and perl working together


  use CGI qw/:standard/;
  print header,
        start_html('A Simple Example'),
        h1('A Simple Example'),
        start_form,
        "What's your name? ",textfield('name'),p,
        "What's the combination?", p,
        checkbox_group(-name=>'words',
                       -values=>['eenie','meenie','minie','moe'],
                       -defaults=>['eenie','minie']), p,
        "What's your favorite color? ",
        popup_menu(-name=>'color',
                   -values=>['red','green','blue','chartreuse']),p,
        submit,
        end_form,
        hr;


   if (param()) {
       print "Your name is",em(param('name')),p,
             "The keywords are: ",em(join(", ",param('words'))),p,
             "Your favorite color is ",em(param('color')),
             hr;
   }
