#!/usr/bin/perl
#
# Establish communcition with WebEC server
# Send information and the receive information back for return
#
#
# Version 2.0 
#	If no parameters are passed, then we will return an html page giving information about us
#	Delay connection to server so we can return page even if not connected
#

use IO::Socket;
use CGI;

##########
# Initilization section
##########
$ec_ver = "2.1";
$ec_date = "May 01 2003";
$peer_addr = "10.6.72.10";
$peer_port = 4543;
$send_to_dir = "/usr/lib/pvx/www_dev/";
$send_suffix = ".ec";


###########
###########


# Gather info from CGI call first, then open connection to the 
# server to print it out

# Get CGI info
$in = new CGI;


#
# If no values then print About info
#

if ( $in->param == 0 ) {
	print $in->header (), $in->start_html( -title => 'ecclient version: ' . $ec_ver ) ;
	print $in->h1( "ecclient by TopForm Software, Inc" );
	print $in->h1( "Version: ", $ec_ver );
	print $in->h1( "Date: ",$ec_date );
	print $in->h1( "Sending requests to: ", $peer_addr );
	print $in->h1( "Using port: ",$peer_port );
	print $in->h1( "Put files into: ", $send_to_dir );
	print $in->h1( "Suffix to use: ",$send_suffix );

	if ( open_server() ) {
		print $in->h1( "Server response: ",$server_response );
	}
	else	{
		print $in->h1( "Server unavailable!!!: ",$err_message );
	}

	print $in->end_html;
	exit;
}


#
# Start connection to server
#

open_server()  or die $err_message ;



#
# set directory and suffix
#
print $server "dir=", $send_to_dir, "\r\n";
print $server "suffix=", $send_suffix, "\r\n";

#
# Now send values
#

foreach $key ($in->param) {              
        @values = $in->param($key);
        print $server "$key=",join(", ",@values),"\n";   
}       


while (($ekey, $eval) = each %ENV) {
	if ( $ekey =~ /^REMOTE_/ ) {
		print $server "$ekey=$eval\n";
	}
}

#
# Say we're done now
#
print $server "END\n";

#
# Now get return data until we see an END
#
	while (<$server>) {
		$line = $_;
		chomp($line);	
		# if it is the word END then we are done
		last if ( $line eq "END" or $line eq "END\r" );
		print "$line\n";
	}	


#
# Now close the connection to the server
#
close ( $server );
 
#
# Done with everything
#
exit;


############
# Subroutines
############


######
# open_server
# 	No arguements, uses global values of $peer_address & $peer_port - will change later
#	$err_message will contain message if error happen, will return undef
#	$server_reponse will contain response from server and will return a 1 if connected
######

sub open_server {

	 # Initialize
	$server_response = "";
	$err_message = "";


	 # open connection if unsuccessful print message and return undef
 	$server = IO::Socket::INET->new(	PeerAddr => $peer_addr ,
 						PeerPort => $peer_port,
 						Proto	=> "tcp",
 						Type	=> SOCK_STREAM )
 	or $err_message =  "Couldn't connect to Web EC Server: $@";	

	if ( $err_message ) {
		return 0;
	}

 	# Set AutoFlush
 	$server->autoflush(1);


 	# get response from server for reference
 	$server_response = <$server>;
}

