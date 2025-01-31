Sub Button1_Click()
    Dim userName As String
    Dim action As String
    Dim stockAmount As Integer
    Dim firstValue As Integer
    Dim returnValue As Integer
    Dim rowNum As Long
    Dim price As Single
    Dim transaction As Single
    Dim moneyLeft As Single
    
    rowNum = ActiveCell.Row
    price = Cells(rowNum, 2).Value
    
    ' Get the valid action (Buy or Sell)
    action = GetValidAction()
    
    userName = GetValidUserName()
    
    stockAmount = InputBox("How much are you " & action & "ing?", "Amount")
    transaction = price * stockAmount
    
    If action = "Buy" Then
        firstValue = ActiveCell.Value
        returnValue = firstValue + stockAmount
        ActiveCell.Value = returnValue
        If userName = "Tom" Then
            moneyLeft = Cells(2, 17)
            moneyLeft = moneyLeft - transaction
            Cells(2, 17) = moneyLeft
        ElseIf userName = "Dad" Then
            moneyLeft = Cells(2, 18)
            moneyLeft = moneyLeft - transaction
            Cells(2, 18) = moneyLeft
        ElseIf userName = "Mom" Then
            moneyLeft = Cells(2, 19)
            moneyLeft = moneyLeft - transaction
            Cells(2, 19) = moneyLeft
        ElseIf userName = "KT" Then
            moneyLeft = Cells(2, 20)
            moneyLeft = moneyLeft - transaction
            Cells(2, 20) = moneyLeft
        ElseIf userName = "Kaylyn" Then
            moneyLeft = Cells(2, 21)
            moneyLeft = moneyLeft - transaction
            Cells(2, 21) = moneyLeft
        ElseIf userName = "Tyler" Then
            moneyLeft = Cells(2, 22)
            moneyLeft = moneyLeft - transaction
            Cells(2, 22) = moneyLeft
        End If
    Else
       firstValue = ActiveCell.Value
        returnValue = firstValue - stockAmount
        ActiveCell.Value = returnValue
        If userName = "Tom" Then
            moneyLeft = Cells(2, 17)
            moneyLeft = moneyLeft + transaction
            Cells(2, 17) = moneyLeft
        ElseIf userName = "Dad" Then
            moneyLeft = Cells(2, 18)
            moneyLeft = moneyLeft + transaction
            Cells(2, 18) = moneyLeft
        ElseIf userName = "Mom" Then
            moneyLeft = Cells(2, 19)
            moneyLeft = moneyLeft + transaction
            Cells(2, 19) = moneyLeft
        ElseIf userName = "KT" Then
            moneyLeft = Cells(2, 20)
            moneyLeft = moneyLeft + transaction
            Cells(2, 20) = moneyLeft
        ElseIf userName = "Kaylyn" Then
            moneyLeft = Cells(2, 21)
            moneyLeft = moneyLeft + transaction
            Cells(2, 21) = moneyLeft
        ElseIf userName = "Tyler" Then
            moneyLeft = Cells(2, 22)
            moneyLeft = moneyLeft + transaction
            Cells(2, 22) = moneyLeft
        End If
    End If
    
End Sub

Function GetValidAction() As String
    Dim action As String
    Dim isValid As Boolean

    ' Initialize the loop
    isValid = False

    Do While Not isValid
        ' Get the user's action (Buy/Sell)
        action = InputBox("Enter your action (Buy or Sell):", "Action")

        ' Check if the entered action is valid (Buy or Sell)
        If action = "Buy" Or action = "Sell" Then
            isValid = True
        Else
            ' If the action is incorrect, show a message
            MsgBox "Invalid action. Please enter either 'Buy' or 'Sell'.", vbExclamation
        End If
    Loop

    ' Return the valid action
    GetValidAction = action
End Function

Function GetValidUserName() As String
    Dim userName As String
    Dim validNames As Variant
    Dim isValid As Boolean
    Dim i As Integer

    ' Define the list of valid names
    validNames = Array("Tom", "Dad", "Mom", "KT", "Kaylyn", "Tyler")

    ' Initialize the loop
    isValid = False

    Do While Not isValid
        ' Get the user's name
        userName = InputBox("Enter your name:", "User Name")

        ' Check if the entered name is in the array
        isValid = False
        For i = LBound(validNames) To UBound(validNames)
            If userName = validNames(i) Then
                isValid = True
                Exit For
            End If
        Next i

        ' If the name is incorrect, show a message
        If Not isValid Then
            MsgBox "Incorrect. Please try again.", vbExclamation
        End If
    Loop

    ' Return the valid user name
    GetValidUserName = userName
End Function