import React, {useEffect, useState, useCallback} from 'react';
import {Row, Col, Tab, Tabs, Button, Image, Modal} from "react-bootstrap";
import {TwitterTimelineEmbed} from 'react-twitter-embed';
import {SocketContext} from "../socket";
import {connect} from "react-redux";

import info from '../assets/infoicon.png';

import "./Contest.css";

import Questions from './Questions.jsx';

import avatar from '../assets/blue_avatar_200.png';


const Contest = ({match}) => {
    const [contest, setContest] = useState([]);
    const [isloaded, setLoaded] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [home, setHomeTeam] = useState([]);
    const [away, setAwayTeam] = useState([]);
    const [sport, setSport] = useState('baseball');
    const [key, setKey] = useState('Questions');
    const [participation, setParticipation] = useState([]);
    const [participations, setParticipations] = useState([]);
    const [allParts, setAllParts] = useState();
    const [allPartsList, setAllPartsList] = useState([]);
    const [activeParts, setActiveParts] = useState([]);
    const [newQuestion, setNewQuestion] = useState();
    const [newCorrectQuestion, setNewCorrectQuestion] = useState();
    const socket = React.useContext(SocketContext);

    const getContest = async () => {
        try {
            const res = await fetch(`/contestdetail/${match.params.id}`, {
                method: "GET",
                headers: {jwt_token: localStorage.token}
            });
            const parseData = await res.json();
            setContest(parseData);
            getEvent(parseData);

        } catch (err) {
            console.error(err.message);
        }
    };

    const getEvent = async (contestRec) => {
        try {
            const res = await fetch(`/event/` + contestRec.event__c, {
                method: "GET",
                headers: {jwt_token: localStorage.token}
            });

            const parseData = await res.json();
            setSport(parseData[0].sport__c);
            setHomeTeam(parseData[0]);
            setAwayTeam(parseData[1]);
            getContestParticipations(contestRec);
            setTimeout(
                function() {
                    setLoaded(true);
                },
                1000
            );

        } catch (error) {
            console.error(error.message);
        }
    }

    const getContestParticipations = async (contestRec) => {
        try {
            const res = await fetch(`/contestparticipations/` + contestRec.sfid, {
                method: "GET",
                headers: {jwt_token: localStorage.token}
            });

            const parseData = await res.json();
            setAllParts(parseData.length);
            var i;
            var activeParts = [];
            var endParts = [];
            for (i = 0; i < parseData.length; i++) {
                if (parseData[i].status__c === 'Active') {
                    activeParts.push(parseData[i]);
                }
            }
            if(contestRec.status__c === 'Finished'){
                for (i = 0; i < parseData.length; i++) {
                    if (parseData[i].status__c !== 'Active') {
                        endParts.push(parseData[i]);
                    }
                }
            }
            endParts.sort((a, b) => (a.PlaceFinish__c < b.PlaceFinish__c) ? 1 : -1)

            setActiveParts(activeParts.length);
            setAllPartsList(endParts);
            setParticipations(activeParts);
            getParticipationByContest(contestRec);

        } catch (err) {
            console.error(err.message);
        }
    }

    const getParticipationByContest = async (contestRec) => {
        try {
            const res = await fetch(`/participationbycontest/` + contestRec.sfid, {
                method: "GET",
                headers: {jwt_token: localStorage.token}
            });

            const parseData = await res.json();
            setParticipation(parseData);
            
        } catch (err) {
            console.error(err.message);
        }
    }

    const handleInfoShow = async () => {
        setShowInfo(true);
    }

    const handleInfoClose = async () => {
        setShowInfo(false);
    }

    const tabset = useCallback(() => {
        setKey('Participants');
    })

    const updateparts = useCallback(() => {
        console.log('update parts in contest');
        console.log(contest.status__c);
        getContestParticipations(contest);
        
    })
    
    useEffect(() => {
        getContest().then(r =>  {
            socket.on("connect", () => {
            });

            socket.on("new_question", question => {
                setNewQuestion(question);

            })
            socket.on("cor_question", question => {
                setNewCorrectQuestion(question);
            })
            socket.on("new_contest", contest => {
                setContest(contest);
            });

            socket.on('disconnect', () =>{
                console.log('reconnect fired!');
            });
 
        });
    }, [socket]);

    useEffect(() => {
        console.log('contest status' + contest.status__c);
        getContestParticipations(contest);
    }, [contest])
    
    return ((
            <>
                {/* Main Body */}
                <div id="contestContainer">
                    <Row className="headerRow">
                        <Col xs={1} sm={1}>
                        </Col>
                        <Col xs={10} sm={10}>
                            <div className="scoreboard">
                                <Row>
                                    <Col sm={5}>
                                        <h5 className="text-center mt-1 aptifer">{home.name}</h5>
                                    </Col>
                                    <Col sm={2}>
                                        <h5 className="text-center mt-1 aptifer">vs.</h5>
                                    </Col>
                                    <Col sm={5}>
                                        <h5 className="text-center mt-1 aptifer">{away.name}</h5>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                        <Col xs={1} sm={1}>
                        </Col>
                    </Row>
                    <Row className="rowBar">
                        <Col xs={1} sm={3}></Col>
                        <Col xs={10} sm={6} className="text-center ">
                            <h4 className="whiteText fontBold aptifer">{contest.sub_title__c}</h4>
                        </Col>
                        <Col xs={1} sm={3}>
                        </Col>
                    </Row>
                    <Tabs activeKey={key} onSelect={(k) => setKey(k)} fill className="ml-2 mr-2">
                        <Tab eventKey="Questions" title="Questions" className="aptifer pb-4 pt-4">
                            <Row>
                                <Col lg={3} sm={1}>

                                </Col>
                                <Col lg={6} sm={10}>
                                    {isloaded &&
                                    <Questions tabset={tabset} updatepart={updateparts} sport={sport} contestid={contest.sfid} 
                                               contestQuestionText={contest.no_questions_text__c} contest={contest}
                                               participation_id={participation.externalid__c}
                                               partsfid={participation.sfid} newQuestion={newQuestion} newCorrectQuestion={newCorrectQuestion}
                                               />
                                    }
                                </Col>
                                <Col lg={3} sm={1}>

                                </Col>
                            </Row>
                        </Tab>
                        <Tab eventKey="Participants" title="Participants" className="pb-4 pt-4 aptifer">

                            {/* loop through participations */}

                            <Row className="partCard">
                                <Col lg={3} sm={1}>

                                </Col>
                                <Col lg={6} sm={10} >
                                    <Row className="colCard "> 
                                        <Col xs={1} lg={1} className="nopadding">
                                        
                                        </Col>
                                        <Col xs={9} lg={10} className="nopadding">
                                            <div className="text-center">
                                                <span class="aptifer">Participants Remaining: {activeParts}/{allParts}</span>
                                            </div>
                                        </Col>
                                        <Col xs={1} lg={1} className="nopadding">
                                        <div className="infoDiv mb-4 justify-content-end">
                                            <a src="#" className="" onClick={handleInfoShow} >
                                                <Image src={info} width="22"></Image>
                                            </a>
                                            <Modal className="modalDiv" show={showInfo} onHide={handleInfoClose}>
                                                <Modal.Header closeButton>
                                                <Modal.Title className="aptifer font16 modalHeader">How To Pick Fun</Modal.Title>
                                                </Modal.Header>
                                                <Modal.Body className="proxima font12 modalBody">
                                                    <span>
                                                        - Pick an answer for each question.
                                                    </span> <br/>
                                                    <span>
                                                        - Click ‘Submit Answers’ before countdown timer reaches zero
                                                    </span><br/>
                                                    <span>
                                                        - Your picks are graded in real-time when the correct answer becomes known in the live event
                                                    </span><br/>
                                                    <span>
                                                        - If or when you reach the limit for wrong answers - the Knockout Limit - you’re removed from the contest
                                                    </span><br/>
                                                    <span>
                                                        - Click Participants to keep track of how your competitors are doing
                                                    </span><br/>
                                                    <span>
                                                        - Click Twitter for contest updates
                                                    </span><br/>
                                                    <span>
                                                        - Visit our website for details on scoring &amp; prizes (https://www.pick.fun/rules)
                                                    </span>
                                                </Modal.Body>
                                                <Modal.Footer>
                                                <Button className="aptifer modalBtn" variant="secondary" onClick={handleInfoClose}>
                                                    Close
                                                </Button>
                                                </Modal.Footer>
                                            </Modal>
                                        </div>
                                        </Col>
                                    </Row>
                                    {contest.status__c === 'Finished' &&
                                        <div>
                                            {allPartsList.map(part => {
                                            return <Row key={part.id} className="colCard ">
                                                <Col xs={2} className="text-center"> <Image src={avatar} roundedCircle
                                                                                        height="50"></Image> </Col>
                                                <Col xs={10}>
                                                    <Row>
                                                        <span className="fontBold proxima">{part.participant_name__c}</span>
                                                        {part.sfid === participation.sfid &&
                                                        <div className="yourpart ml-3 proxima">
                                                            You
                                                        </div>
                                                        }
                                                    </Row>
                                                    <Row>
                                                        <Col sm={12} lg={12} class="proxima">
                                                            Rank: {part.placefinish__c}
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        })}
                                        </div>
                                        
                                    }
                                    {contest.status__c !== 'Finished' &&
                                        <div>
                                        {participations.map(part => {
                                            return <Row key={part.id} className="colCard ">

                                                <Col xs={2} className="text-center"> <Image src={avatar} roundedCircle
                                                                                        height="50"></Image> </Col>
                                                <Col xs={10}>
                                                    <Row>
                                                        <span className="fontBold proxima">{part.participant_name__c}</span>
                                                        {part.sfid === participation.sfid &&
                                                        <div className="yourpart ml-3 proxima">
                                                            You
                                                        </div>
                                                        }
                                                    </Row>
                                                    <Row>
                                                        <Col sm={12} lg={6} class="proxima">
                                                            Wrong Answers: {part.wrong_answers__c}
                                                        </Col>
                                                        <Col sm={12} lg={6} class="proxima">
                                                            Wrong Answers Allowed: {part.wrong_answers_allowed__c}
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                            })}
                                        </div>
                                    }
                                </Col>
                                <Col lg={3} sm={1}>

                                </Col>
                            </Row>
                            
                            </Tab>
                        <Tab eventKey="Chat" title="Twitter" className="aptifer pb-4 pt-4">
                            <Row>
                                <Col lg={3} sm={1}>

                                </Col>
                                <Col lg={6} sm={10} className=''>
                                    <TwitterTimelineEmbed
                                        sourceType="profile"
                                        screenName="pickfungames"
                                        options={{height: 400}}
                                    />
                                </Col>
                                <Col lg={3} sm={1}>
                                    
                                </Col>
                            </Row>
                        </Tab>
                    </Tabs>
                </div>

            </>
        )
    )
}

export default connect()(Contest);
