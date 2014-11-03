#!/bin/bash
testRunFolder=$1
listener=$2
resultsFolder=$testRunFolder/results
reportsFolder=$testRunFolder/reports
resourcesFolder=$testRunFolder/resources

homepath="/home/ec2-user/jmeter"
#jmeterdir="/home/ec2-user/apache-jmeter-2.11"
jmeterdir="/usr/share/jmeter"

#cp  $homepath/extras/jmeter-tree_view.xsl $resourcesFolder/
#cp  $homepath/extras/jmeter-results-report_21.xsl $resourcesFolder/
#cp  $homepath/extras/jmeter-results-detail-report_21.xsl $resourcesFolder/
#cp  $homepath/extras/expand.png $resourcesFolder/
#cp  $homepath/extras/collapse.png $resourcesFolder/
#cp  $homepath/extras/collapse.png $resourcesFolder/
#cp  $homepath/extras/chartExample.html $resourcesFolder/

RESULTSHEAD=`head -n 1 $resultsFolder/$listener`
RESULTSTAIL=`tail -n +2 $resultsFolder/$listener`
RESULTSXSL='<?xml-stylesheet type="text/xsl" href="../resources/jmeter-results-report_21.xsl"?>'
DETAILEDRESULTSXSL='<?xml-stylesheet type="text/xsl" href="../resources/jmeter-results-detail-report_21.xsl"?>'
RESULTSTREEXSL='<?xml-stylesheet type="text/xsl" href="../resources/jmeter-tree_view.xsl"?>'

echo "$RESULTSHEAD $DETAILEDRESULTSXSL $RESULTSTAIL" > $reportsFolder/results_detailed_report.xml
echo "$RESULTSHEAD $RESULTSXSL $RESULTSTAIL" > $reportsFolder/results_summary.xml
echo "$RESULTSHEAD $RESULTSTREEXSL $RESULTSTAIL" > $reportsFolder/results_tree.xml

graphReport="<HTML><BODY><TABLE>"

makeBoth(){
graphName=$1
java -jar  $jmeterdir/lib/ext/CMDRunner.jar --tool Reporter --generate-png $resultsFolder/$graphName.png --generate-csv $resultsFolder/$graphName.csv --input-jtl $resultsFolder/$listener --plugin-type $graphName --width 800 --height 600
graphReport+="<TR><TH>$graphName <A href=../results/$graphName.csv>raw data</A></TH></TR>"
graphReport+="<TR><TD><IMG src=../results/$graphName.png></TD></TR>"
graphReport+="<TR><TD><A href=../results/$graphName.csv>raw data</A></TD></TR>"
}

makeBoth ResponseTimesOverTime
makeBoth ResponseCodesPerSecond
makeBoth ResponseTimesDistribution
makeBoth ThroughputVsThreads
makeBoth TimesVsThreads
makeBoth TransactionsPerSecond
makeBoth PageDataExtractorOverTime
makeBoth ThreadsStateOverTime
makeBoth BytesThroughputOverTime
makeBoth HitsPerSecond
makeBoth LatenciesOverTime

graphReport+="<TABLE></BODY></HTML>"
echo $graphReport > $reportsFolder/graphs.html
