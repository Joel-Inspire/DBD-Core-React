<%@ Language=VBScript %>
<!-- #include file="include/db.inc"-->
<%

'----------------------------
'
'Date: 02/01/2000
'
'Author: Tyler Downs
'
'Description: 
'This page writes out the text file for proeps.exe based on the 
'products to product attributes to placeholder to placeholder 
'attributes
'
'---------------------------
dim counter
'get address type the user used
session("addresstype") = request("addresstype")

'Retrieve all Global variables
productid = request("productid")
peopleid = request("peopleid")
customerid = request("customerid")
sessionid = right(Session.SessionID ,5)

add2flag = flase


'Retrieve all of the fields on the form
'First Name
if request("rqfirstname") <> "" then
	firstname = request("rqfirstname")
else
	firstname = request("firstname")
end if

if request("sal") <> "" then
 if request("psal") <> "" then
 firstname = trim(request("sal")) &  " "  & firstname 
 end if
end if 
'Middle Name
if request("rqmiddlename") <> "" then
    middlename = request("rqmiddlename")
	middlein = trim(request("rqmiddlename"))
	if len(middlein) = 1 then 
	middlein = middlein & "."
	end if
else
	middlename = request("middlename")
	middlein = trim(request("middlename"))
	if len(middlein) = 1 then 
	middlein = middlein & "."
	end if
end if

'Last Name
if request("rqlastname") <> "" then
	lastname = request("rqlastname")
else
	lastname = request("lastname")
end if

'Email
if request("rqemail") <> "" then
	email = request("rqemail")
else
	email = request("email")
end if

'deparment
if request("rqdepartment") <> "" then
	department = request("rqdepartment")
else
	department = request("department")
end if

'Title
if request("rqtitle") <> "" then
	title = request("rqtitle")
else
	title = request("title")
end if 

'Home Area Code
if request("rqhomearea") <> "" then
	homearea = request("rqhomearea")
else
	homearea = request("homearea")
end if

'Home City
if request("rqhomecity") <> "" then
	homecity = request("rqhomecity")
else
	homecity = request("homecity")
end if 


'Home Phone
if request("rqhomephone") <> "" then
	homephone = request("rqhomephone")
else
	homephone = request("homephone")
end if

'Home Ext
if request("rqhomeext") <> "" then
	homeext = request("rqhomeext")
else
	homeext = request("homeext")
end if

if homeext <> "" then
	homephone = homephone & " x" & homeext
end if

'Work Area Code
if request("rqworkarea") <> "" then
	workarea = request("rqworkarea")
else 
	workarea = request("workarea")
end if

'Work City
if request("rqworkcity") <> "" then
	workcity = request("rqworkcity")
else
	workcity = request("workcity")
end if

'Work Phone Number
if request("rqworkphone") <> "" then
	workphone = request("rqworkphone")
else
	workphone = request("workphone")
end if 

'Work Extension
if request("rqworkext") <> "" then
	workext = request("rqworkext")
else
	workext = request("workext")
end if

if workext <> "" then
workphone = workphone & " x" & workext
end if
'Mobile Area Code
if request("rqmobilearea") <> "" then
	mobilearea = request("rqmobilearea")
else
	mobilearea = request("mobilearea")
end if

'Mobile City 
if request("rqmobilecity") <> "" then
	mobilecity = request("rqmobilecity")
else
	mobilecity = request("mobilecity")
end if 

'Mobile Phone Number
if request("rqmobilephone") <> "" then
	mobilephone = request("rqmobilephone")
else
	mobilephone = request("mobilephone")
end if 

'Mobile Ext
if request("rqmobileext") <> "" then
	mobileext = request("rqmobileext")
else
	mobileext = request("mobileext")
end if 

if mobileext <> "" then
	mobilephone = mobilephone & " x" & mobileext
end if

'Fax Area Code
if request("rqfaxarea") <> "" then
	faxarea = request("rqfaxarea")
else
	faxarea = request("faxarea")
end if 

'Fax City 
if request("rqfaxcity") <> "" then
	faxcity = request("rqfaxcity")
else
	faxcity = request("faxcity")
end if 

'Fax Phone Number
if request("rqfaxphone") <> "" then
	faxphone = request("rqfaxphone")
else
	faxphone = request("faxphone")
end if 

'Fax Extension 
if request("rqfaxext") <> "" then
	faxext = request("rqfaxext")
else
	faxext = request("faxext")
end if

if faxext <> "" then
	faxphone = faxphone & " x" & faxext
end if
'Address Line 1
if request("rqaddress1") <> "" then
	address1 = request("rqaddress1")
else
	address1 = request("address1")
end if

'Address Line 2
if request("rqaddress2") <> "" then 
	address2 = request("rqaddress2")
else 
	address2 = request("address2")
end if 

'City
if request("rqcity") <> "" then 
	city = request("rqcity")
else
	city = request("city")
end if 

'State
if request("rqstate") <> "" then
	state = request("rqstate")
else
	state = request("state")
end if

'Zip
if request("rqzip") <> "" then
	zip = request("rqzip")
else 
	zip = request("zip")
end if 

'Country
if request("rqcountry") <> "" then
	country = request("rqcountry")
else
	country = request("country")
end if 

'Shipping Address 1
if request("rqshippingaddress1") <> "" then
	shipppingaddress1 = request("rqshippingaddress1")
else
	shipppingaddress1 = request("shippingaddress1")
end if 


'Shipping Address 2
If request("rqshippingaddress2") <> "" then
	shipppingaddress2 = request("rqshippingaddress2")
else
	shipppingaddress2 = request("shippingaddress2")
end if

'Shipping Address City
if request("rqshippingcity") <> "" then
	shippingcity = request("rqshippingcity")
else
	shippingcity = request("shippingcity")
end if

'Shipping State
if request("rqshippingstate") <> "" then
	shippingstate = request("rqshippingstate")
else
	shippingstate = request("shippingstate")
end if

if request("rqshippingzip") <> "" then
	shippingzip = request("rqshippingzip")
else
	shippingzip = request("shippingzip")
end if


'Handle the phone section
if request("pfax") = "" then
	faxarea = ""
	faxcity = "" 
	faxphone = ""
	faxext = "" 
end if 
if request("phome") = "" then
	homearea = ""
	homecity = "" 
	homephone = ""
	homeext = "" 
end if 
if request("pmobile") = "" then
	mobilearea = ""
	mobilecity = ""
	mobilephone = ""
	mobileext = ""
end if

'Setup the placeholder array
'Count the number of placeholders on this product and
'Redim the placholder array to match
dim arrSort




strsql = "SELECT  Tbl_ProductPlaceholders.Productid, Tbl_Placeholders.Field " & _
"FROM  Tbl_Placeholders INNER JOIN " & _
"Tbl_ProductPlaceholders ON Tbl_Placeholders.Placeholderid = Tbl_ProductPlaceholders.Placeholderid " & _
"WHERE (((Tbl_ProductPlaceholders.Productid)=" & productid & ")) " & _
"ORDER BY Tbl_ProductPlaceholders.seq"

set rsarrplace = server.createobject("adodb.recordset")
rsarrplace.open strsql,dbc,3,3
redim arrSort(rsarrplace.recordcount - 1,4)
set rsarrplace = nothing


'Set the product placeholders and use the fields about to fill

strsql = "SELECT Tbl_ProductPlaceholders.seq, Tbl_ProductPlaceholders.Productid, Tbl_ProductPlaceholders.move, Tbl_Placeholders.Field AS Placeholder, Tbl_PlaceholderAttr.LeadText, Tbl_PlaceholderAttr.Field, Tbl_PlaceholderAttr.Text, Tbl_PlaceholderAttr.Seqence, Tbl_PlaceholderAttr.notnull " & _
"FROM (Tbl_ProductPlaceholders INNER JOIN Tbl_Placeholders ON Tbl_ProductPlaceholders.Placeholderid = Tbl_Placeholders.Placeholderid) INNER JOIN Tbl_PlaceholderAttr ON Tbl_Placeholders.Placeholderid = Tbl_PlaceholderAttr.Placeholderid " & _
"WHERE (((Tbl_ProductPlaceholders.Productid)=" & productid & ")) " & _
"ORDER BY Tbl_ProductPlaceholders.seq, Tbl_Placeholders.seq, Tbl_PlaceholderAttr.Seqence" 


set rsplc = server.createobject("Adodb.Recordset")
rsplc.open strsql,dbc,3,3

'Get the section placeholders

placeholder = rsplc("PLACEHOLDER")	
counter = 0
For i = 1 to rsplc.recordcount

	if placeholder <> rsplc("placeholder") then
			arrsort(counter,1) = 1
			arrsort(counter,2) = placeholder
			arrsort(counter,3) = combined
			arrsort(counter,4) = move
			counter = counter + 1
			combined = ""
			placeholder = rsplc("placeholder")
					
	end if
	select case ucase(trim(rsplc("Field")))
					
					'Do the people section
					case "FIRSTNAME"
						combined = combined & firstname
						temp = firstname
					case "MIDDLENAME"
						combined = combined & middlename
						temp = middlename
					case "MIDDLEIN"
						combined = combined & middlein
						temp = middlein
					case "LASTNAME"
						combined = combined & lastname
						temp = lastname
					case "SAL"
						combined = combined & sal
						temp = sal
					case "TITLE"
						combined = combined & title
						temp = title
					case "EMAIL"
						combined = combined & email
						temp = email
						
					'Do the address section
					case "ADDRESS1"
						combined = combined & address1
						temp = address1
					case "ADDRESS2"
						temp = address2
						
						if address2 <> "" then
							combined = combined & address2
							add2flag = true
						end if
					case "CITY"
						combined = combined & city
						temp = city
					case "STATE"
						combined = combined & state
						temp = state
					case "ZIP"			
						combined = combined & zip
						temp = zip
						
						
					'Do the phone section
					case "HOMEAREA"
						combined = combined & homearea
					case "HOMECITY"
						combined = combined & homecity
					case "HOMEPHONE"
						combined = combined & homephone
					case "HOMEEXT"
						if trim(homeext) <> "" then
							combined = combined & "x" & homeext
						end if
					case "WORKAREA"
						combined = combined & workarea
					case "WORKCITY"
						combined = combined & workcity
					case "WORKPHONE"
						combined = combined & workphone
					case "WORKEXT"
						if trim(workext) <> "" then
							combined = combined & "x" & workext
						end if
					case "MOBILEAREA"
						combined = combined & mobilearea
					case "MOBILECITY"
						combined = combined & mobilecity
					case "MOBILEPHONE"
						combined = combined & mobilephone
					case "MOBILEEXT"
						if trim(mobileext) <> "" then
							combined = combined & "x" & mobileext
						end if
					case "FAXAREA"
						combined = combined & faxarea
					case "FAXCITY"
						combined = combined & faxcity
					case "FAXPHONE"
						combined = combined & faxphone
					case "FAXEXT"
						if trim(faxext) <> "" then
							combined = combined & "x" & faxext
						end if


					'Do the department section
					case "DEPARTMENT"
						combined = combined & department
					
		end select	
			    'combined = trim(combined)
				if rsplc("notnull") = false and trim(combined) <> ""  then				
              	 if trim(rsplc("leadtext")) <> "" then
		  		  select case rsplc("leadTEXT")
						case "SPACE"
							combined = combined & " "					
						case else
							if asc(trim(rsplc("leadtext"))) = 149 then
							 	combined = rsplc("leadTEXT") & "  " & combined & "  "							
  						      else
							combined = rsplc("leadTEXT") & combined 
							end if 

					end select
	       		  end if
	       		  response.write rsplc("field") & " " & combined & " false <br>"
				 end if
	       		

     			       			
			   if rsplc("notnull") = true and trim(combined) <> ""  then				
				 	if ucase(rsplc("field")) <> "ADDRESS2" Then
				 	if trim(rsplc("leadtext")) <> "" then
			  		  select case rsplc("leadTEXT")
							case "SPACE"
								combined = combined & " "					
							case else
								if asc(trim(rsplc("leadtext"))) = 149 then
							 	combined = rsplc("leadTEXT") & "  " & combined & "  "											
								else
									combined = rsplc("leadTEXT") & combined 
								end if 
						end select
						
					 end if
					 if trim(rsplc("text")) <> ""  then
		  		  			select case rsplc("TEXT")
							case "SPACE"
								combined = combined & " "					
							case else
								if asc(trim(rsplc("text"))) = 149 then
								response.write "Got the buttet <br>"
								 combined = combined & "  "	& rsplc("TEXT") & "  " 

								else
								  combined = combined & rsplc("TEXT") 
							end if 
							end select
						end if
					else
					 

			
					 if add2flag = true then 
					 if trim(rsplc("leadtext")) <> "" then
			  		  select case rsplc("leadTEXT")
							case "SPACE"
								combined = combined & " "					
							case else
								if asc(trim(rsplc("leadtext"))) = 149 then
							 	combined = rsplc("leadTEXT") & "  " & combined & "  "											
								else
									combined = rsplc("leadTEXT") & combined 
								end if 
						end select
						
					 end if
					 if trim(rsplc("text")) <> ""  then
		  		  			select case rsplc("TEXT")
							case "SPACE"
								combined = combined & " "					
							case else
								if asc(trim(rsplc("text"))) = 149 then
								response.write "Got the buttet <br>"
								 combined = combined & "  "	& rsplc("TEXT") & "  " 

								else
								  combined = combined & rsplc("TEXT") 
							end if 
							end select
						end if

					 
					 
					 
					 
					 end if 
					end if
	    		 end if 
	       		  response.write rsplc("field") & " " & combined & " true <br>"

				
				if trim(combined) <> "" and rsplc("notnull") <> true then
    
					if trim(rsplc("text")) <> ""  then
		  		  	select case rsplc("TEXT")
							case "SPACE"
								combined = combined & " "					
							case else
								if asc(trim(rsplc("text"))) = 149 then
								response.write "Got the buttet <br>"
								 combined = combined & "  "	& rsplc("TEXT") & "  " 

								else
								  combined = combined & rsplc("TEXT") 
							end if 
					end select

	       		  end if
	       		  response.write rsplc("field") & " " & combined & " other <br>"
	       		end if
	       		


				move= rsplc("move")
				rsplc.movenext
				
next	
		
arrsort(counter,1) = 1
arrsort(counter,2) = placeholder
arrsort(counter,3) = combined
arrsort(counter,4) = move



'First check if alignment is specfied
align = false
for I = 1 to ubound(arrsort)
	if arrsort(i,4) <> 0 then
		align = true
	end if
next

'If special Alignment = false then adjust addressline2 and cst
if align = false then
	for I = 1 to ubound(arrsort)
		if arrsort(i,2) = "AD2" then ad2line = i
		if arrsort(i,2) = "CST" then cstline = i
	next

if arrsort(ad2line,3) = "" then
	arrsort(ad2line,3) = arrsort(cstline,3) 
	arrsort(cstline,3) = ""
end if
end if
		
		
			

'Next Check if there are any blank fields to move objects into
if align = true then
	align = false
	for I = 1 to ubound(arrsort)
		if len(arrsort(i,3)) = 0 then
			align = true
		end if
	next
end if

if align = true then
	for x = 1 to ubound(arrsort)
		for i = 1 to ubound(arrsort) 
		 select	case arrsort(i,4)
				case 1
					'Move Up
					if len(arrsort(i - 1,3) ) = 0 and arrsort(i-1,4) =1 then
						arrsort(i -1,3) = arrsort(i,3)
						arrsort(i,3) = ""
					end if
				case 2
					'Move Down
					if len(arrsort(i + 1,3) ) = 0 and arrsort(i+1,4) = 2 then
						arrsort(i + 1,3) = arrsort(i,3)
						arrsort(i,3) = ""
					end if
					
			end select
		next
	next
	
'Handle the last array element
	select case arrsort(ubound(arrsort),4)
		case 1
	'Move Up

					if len(arrsort(ubound(arrsort) - 1,3) ) = 0 and arrsort(ubound(arrsort) -1,4) =1 then
						arrsort(ubound(arrsort) -1,3) = arrsort(ubound(arrsort),3)
						arrsort(ubound(arrsort),3) = ""
					end if
					
		case 0 
			     if len(arrsort(ubound(arrsort),3) ) = 0 and arrsort(ubound(arrsort) -1,4) = 2 then
						arrsort(ubound(arrsort),3) = arrsort(ubound(arrsort) -1,3)
						arrsort(ubound(arrsort) -1,3) = ""
				 	for x = 1 to ubound(arrsort)
					for i = 1 to ubound(arrsort) 
					 select	case arrsort(i,4)
					case 1
						'Move Up
						if len(arrsort(i - 1,3) ) = 0 and arrsort(i-1,4) =1 then
							arrsort(i -1,3) = arrsort(i,3)
							arrsort(i,3) = ""
						end if
					case 2
						'Move Down
						if len(arrsort(i + 1,3) ) = 0 and arrsort(i+1,4) = 2 then
							arrsort(i + 1,3) = arrsort(i,3)
							arrsort(i,3) = ""
				end if
					
			end select
		next
	next

				 end if
	end select
end if



'Open the session file in the proofing dir
sScriptDir = Request.ServerVariables("SCRIPT_NAME")
sScriptDir = StrReverse(sScriptDir)
sScriptDir = Mid(sScriptDir, InStr(1, sScriptDir, "/"))
sScriptDir = StrReverse(sScriptDir)
sPath = Server.MapPath(sScriptDir) & "\"

Set FSO = Server.CreateObject("Scripting.FileSystemObject")

set myfile = fso.CreateTextFile(spath & "\proof\" & sessionid &".txt",true)

for i = lbound(arrsort) to ubound(arrsort) 
	myfile.writeline chr(34) & arrsort(i,1) & arrsort(i,2) & chr(34) & "," & chr(34) & trim(arrsort(i,3)) & chr(34)
next

'Do the update of the database so when the use clicks on edit we go back the information they selected
strsql = "UPDATE Tbl_People SET TFCustID= '" & Session("TfCustomerID") & "'," & _
	" Email= '" & Email & "' ," & _	
	" FirstName= '" & firstname & "' ," & _
	" MiddleName= '" & middlename & "'," & _
	" LastName= '" & lastname & "' ," & _	
	" Department= '" & department & "'," & _
	" title= '" & title & "' ," & _
	" HomeArea= '" & homearea & "' ," & _
	" HomeCity= '" & homecity & "' ," & _
	" HomePhone= '" & homephone & "' ," & _
	" HomeExt= '" & homeext & "' ," & _
	" WorkArea= '" & workarea & "' ," & _
	" WorkCity= '" & workcity & "' ," & _
	" WorkPhone= '" & workphone & "' ," & _
	" WorkExt= '" & workext & "' ," & _
	" MobileArea= '" & mobilearea & "' ," & _
	" Mobilecity= '" & mobilecity & "' ," & _
	" Mobilephone= '" & mobilephone & "' ," & _
	" Mobileext= '" & mobileext & "' ," & _
	" FaxArea= '" & faxarea  & "' ," & _
	" Faxcity= '" & faxcity & "' ," & _
	" Faxphone= '" & faxphone & "' ," & _
	" Faxext= '" & faxext & "' ," & _
	" Bestmethod= '" &  bestmethod & "' ," & _
	" Address1= '" &  address1 & "' ," & _
	" Address2= '" &  address2 & "' ," & _
	" City= '" &  city & "' ," & _
	" State= '" &  state & "' ," & _
	" Zip= '" &  zip & "' ," & _
	" Country= '" &  country & "' ," & _
	" ShippingAddress1= '" &  shipppingaddress1  & "' ," & _
	" ShippingAddress2= '" &  shipppingaddress2  & "' ," & _
	" ShippingCity= '" &  shipppingcity & "' ," & _
	" ShippingState= '" &  shipppingstate  & "' ," & _
	" ShippingZip= '" &  shipppingzip  & "' ," & _
	" ShippingCountry= '" &  shipppingcountry & "'" & _
	" WHERE (((Tbl_People.PeopleID)=" & request("peopleid") & "));"

'Call the aspexec 
if Request.querystring("Done") <> 1 then
	
	set objProcess = Server.CreateObject("EZorder.Processor")
	objProcess.fontfile = temppath & trim(productid) & "f.pdf"
	objProcess.varfile = temppath & trim(productid) & "v.pdf"
	objProcess.logofile = temppath & trim(productid) & "l.pdf"
	objProcess.Proofdir = spath & "proof\" 
	objProcess.Productid = trim(productid)
	objProcess.SessionID = trim(sessionid)
	objProcess.LogFile = spath & "proof\log.txt" 
	objProcess.log = true
	objProcess.ProcessPDf
	strresult = "Ok"
	set objProcess = nothing
else
	strresult = "Ok"
end if


if strresult = "Ok" then
	response.redirect "checkproof.asp?productid=" & productid & "&peopleid=" & peopleid & "&customerid=" & customerid
else
	response.write "Proeps.exe is not online"
end if




%>