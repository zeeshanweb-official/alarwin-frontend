import React, { useEffect, useState } from 'react'
import { Carousel, Col, Button, Modal, Row, Image } from 'react-bootstrap'
import { connect } from 'react-redux'
import moment from 'moment'
import Timer from 'react-compound-timer'

import Question from './Question.jsx'
import Answers from './Answers.jsx'

import baseball from '../assets/Baseballspinning.gif'
import football from '../assets/football.gif'
import basketball from '../assets/basketball.gif'
import hourglass from '../assets/hourglass.png'
import { SocketContext } from '../socket.js'

import './Questions.css'

const Questions = props => {
  const [questions, setQuestions] = useState([])
  const [allquestions, setAllQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [questionids, setQuestionIds] = useState([])
  const [questionNum, setQuestionNum] = useState(1)
  const [selectedCount, setSelectedCount] = useState(0)
  const [subSegmentCount, setSubsegmentCount] = useState(0)
  const [subsegplusone, setSubSegPlusOne] = useState(0)
  const [partWrongAnswer, setPartWrongAnswer] = useState([])

  const [publishedQuestions, setPublishedQuestions] = useState(0)
  const [placeFin, setPlaceFinish] = useState(0)
  const [review, setReview] = useState(false)
  const [showAnswer, setShowAnswer] = useState(true)
  const [counter, setCounter] = useState(undefined)
  const [answerList, setAnswerList] = useState([])
  const [inactive, setInactive] = useState(false)
  const [showSubmitCount, setShowSubmitCount] = useState(0)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [showEndBanner, setShowEndBanner] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isShowWaiting, setShowWaiting] = useState(false)
  const [answerListShow, setAnswerListShow] = useState(false)
  const [showKnockOut, setKnockOut] = useState(false)
  const [contestKnockoutText, setContestKnockoutText] = useState([])
  const [showContestWon, setShowContestWon] = useState(false)
  const [contestWonText, setContestWonText] = useState([])
  const [showContestFinished, setShowContestFinished] = useState(false)
  const [contestFinishedText, setContestFinishedText] = useState([])
  const carouselRef = React.createRef()
  const socket = React.useContext(SocketContext)
  const [newQuestion, setNewQuestion] = useState()
  const [newCorrectQuestion, setNewCorrectQuestion] = useState()

  const getAllQuestions = async () => {
    try {
      const res = await fetch(`/allquestions/${props.contestid}`, {
        method: 'GET',
        headers: { jwt_token: localStorage.token }
      })

      const parseData = await res.json()
      setAllQuestions(parseData)
    } catch (err) {
      console.error('get questions error' + err.message)
    }
  }

  const getQuestions = async () => {
    try {
      doGetParticipationWrongAnswers()

      const res = await fetch(`/questions/${props.contestid}`, {
        method: 'GET',
        headers: { jwt_token: localStorage.token }
      })

      const parseData = await res.json()
      var nonLockedQuestionsArr = []
      var questionIdArr = []
      for (var i = 0; parseData.length > i; i++) {
        questionIdArr.push(parseData[i].sfid)
        if (parseData[i].islocked__c !== true) {
          nonLockedQuestionsArr.push(parseData[i])
        }
      }

      if (nonLockedQuestionsArr.length === 0) {
        setReview(true)
      }
      var openedtimerval

      if (props.contest.opened_timer__c !== null) {
        const res = await fetch(`/contestdetail/` + props.contestid, {
          method: 'GET',
          headers: { jwt_token: localStorage.token }
        })
        const parseContestData = await res.json()
        openedtimerval = parseContestData.opened_timer__c
        //if there are questions that aren't locked, then set the timing based on how much time is left
        if (nonLockedQuestionsArr.length > 0 && openedtimerval !== null) {
          var questime = props.contest.question_timer__c
          var millival = questime * 1000
          var currtime = moment().valueOf()
          var closedTimerInt = millival + parseInt(openedtimerval)
          var diffTime = moment(closedTimerInt).diff(currtime)

          // if (diffTime < 0) {
          //     setCounter(0);
          //     $('.timerdiv').removeClass('hiddenTimer');
          // } else {
          //     setCounter(diffTime);
          //     $('.timerdiv').removeClass('hiddenTimer');
          // }
        } else {
        }
      }

      setQuestions(parseData)
      //set question count
      setPublishedQuestions(parseData.length)
    } catch (err) {
      console.error('get questions error' + err.message)
    }
  }

  // select a question and increment/decrement the question number on the screen
  const handleSelect = (selectedIndex, e) => {
    setIndex(selectedIndex)
    setQuestionNum(selectedIndex + 1)
  }

  const resetLogic = async () => {
    setSubmitted(false)
    setReview(false)
    setShowAnswer(true)
    setShowWaiting(false)
  }

  //close info modal on question
  const handleSubmitClose = async () => {
    setShowSubmitModal(false)
    setShowSubmitCount(1)
  }

  const handleEndShow = async () => {
    setShowEnd(true)
    setShowEndBanner(true)
  }
  //close info modal on question
  const handleEndClose = async () => {
    setShowEnd(false)
  }

  const doGetParticipationWrongAnswers = async () => {
    try {
      console.log('do get part answers')
      const partid = props.participation_id
      console.log(props.participation_id)
      const body = { partid }
      const response = await fetch('/participationswronganswer', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      const parseData = await response.json()

      console.log('parts list' + JSON.stringify(parseData))
      console.log('parse wrong answers' + parseData.wrong_answers__c)
      setPartWrongAnswer(parseData)
      //set sort of timeout to check waiting for finished game
      console.log('status' + parseData.status__c)
      if (parseData.status__c === 'Knocked Out') {
        console.log('player is knocked out')
        handleKnockout()
      }

      setTimeout(function () {
        checkFinished()
      }, 5000)

      props.updatepart(parseData)
    } catch (err) {
      console.error(err.message)
    }
  }

  const checkFinished = async () => {
    const res = await fetch(`/contestdetail/` + props.contestid, {
      method: 'GET',
      headers: { jwt_token: localStorage.token }
    })
    const parseContestData = await res.json()

    if (parseContestData.status__c === 'Finished') {
      //reaching this part but not running knocked out

      console.log('end of contest')
      setShowContestFinished(true)
      handleContestEnd()
      handleEndShow()
    } else {
    }
  }

  const handleKnockout = async () => {
    try {
      if (placeFin === 'Knocked Out') {
        console.log('already DNF, dont show')
      } else {
        console.log('not DNF yet')
        handleEndShow()
        setPlaceFinish('Knocked Out')
        setKnockOut(true)
        setContestKnockoutText(props.contest.knockout_text__c)
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleContestEnd = async () => {
    try {
      //check if there are other participations active
      const response = await fetch(
        `/allendingparticipations/` + props.contest.sfid,
        {
          method: 'GET',
          headers: {
            jwt_token: localStorage.token,
            'Content-type': 'application/json'
          }
        }
      )

      const parseRes = await response.json()
      var placefinish
      var ko = false
      var winningParts = []
      winningParts.push(parseRes[0])

      //TODO - andrew make sure that ko is showing up for already knocked out participants
      for (var k = 0; k < parseRes.length; k++) {
        if (parseRes[k].sfid === props.partsfid) {
          placefinish = parseRes[k].placefinish__c
          console.log('ending parts' + parseRes[k])
          if (parseRes[k].status__c === 'Knocked Out') {
            ko = true
          }
        }
        if (
          parseRes[0].wrong_answers__c === parseRes[k].wrong_answers__c &&
          parseRes[0].sfid !== parseRes[k].sfid
        ) {
          winningParts.push(parseRes[k])
        }
      }

      if (placeFin === 0) {
        setPlaceFinish(placefinish)
      }

      if (placefinish === 1) {
        console.log('handling contest won')
        handleContestWon(winningParts.length)
      }
      if (placefinish > 1 && !ko) {
        console.log(
          'handle end show in contest end place finish not 1' + placefinish
        )

        setContestFinishedText(
          'Close but no cigar. You survived but someone scored better than you - better luck next time. Thanks for picking!'
        )
      }
      console.log('is knocked out' + ko)
      if (ko) {
        setContestFinishedText(props.contest.knockout_text__c)
      }
    } catch (err) {
      console.log('err on contest end' + err.message)
    }
  }

  const handleContestWon = async winnercount => {
    try {
      setShowContestWon(true)

      if (winnercount === 1) {
        console.log('single winner')
        setContestWonText(
          'WOW!! Congratulations - you won the entire prize pot! We’ll contact you soon to arrange payment. Thanks for picking!'
        )
      } else {
        console.log('miltiple winner')
        setContestWonText(
          'Nice! You tied for part of the prize with some other people. We’ll contact you soon to arrange payment. Thanks for picking!'
        )
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  const setTimer = () => {
    var timerMilli = props.contest.question_timer__c * 1000
    setCounter(timerMilli)
  }

  const disableQuestions = async () => {
    try {
      console.log('in disable questions')
      handleSubmitClose()
      var conid = props.contestid
      const body = { conid }
      const res = await fetch(`/disableQuestions/`, {
        method: 'POST',
        headers: {
          jwt_token: localStorage.token,
          'Content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const parseData = await res.json()

      //   $('.timerdiv').addClass('hiddenTimer')
      setReview(true)
      setQuestions(parseData)
      setShowWaiting(false)
      setIndex(0)
      setQuestionNum(1)
    } catch (err) {
      console.log('disable questions err : ' + err.message)
    }
  }

  const handleSubmitAnswers = async () => {
    try {
      handleSubmitClose()
      setSubmitted(true)
      setShowWaiting(true)
      props.tabset()
      const partanswers = answerList
      const body = { partanswers }
      const res = await fetch(`/submitpartanswers`, {
        method: 'POST',
        headers: {
          jwt_token: localStorage.token,
          'Content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const parseData = await res.json()
      if (!parseData) {
        setPartWrongAnswer({
          ...partWrongAnswer,
          wrong_answers__c: ++partWrongAnswer.wrong_answers__c
        })
      }
      const questionIndex = questions
        .map(r => {
          return r.sfid
        })
        .indexOf(partanswers[0].question__c)
      const tempQuestions = questions
      tempQuestions[questionIndex].selection__c = partanswers[0].selection__c
      tempQuestions[questionIndex].selection_value__c =
        partanswers[0].selection_value__c
      setQuestions(tempQuestions)
      setAnswerListShow(false)
      setSelectedCount(0)
      setSubsegmentCount(1)
    } catch (err) {
      console.log('handle submit answers err : ' + err.message)
    }
  }

  const handleSubsegmentCount = async subseg => {
    var minussubseg = questions.length - subseg
    setSubSegPlusOne(minussubseg)
    setSubsegmentCount(subseg)
    if (minussubseg > 1) {
      setQuestionNum(subseg + 1)
    }
  }

  const handleKnockoutChild = async () => {
    console.log('knockout callout in Questions js')
    console.log(partWrongAnswer.wrong_answers__c)
  }

  const updateAnswerList = async childData => {
    try {
      //if the answer list is empty, add the answered question from the Question JS
      if (answerList.length < 1) {
        //     console.log('starting answer list');
        answerList.push(childData)
      }
      var addTo = true
      //if answer list contains the question answer already, then replace it, otherwise add it
      for (var i = 0; i < answerList.length; i++) {
        if (childData.question__c === answerList[i].question__c) {
          //replace existing question

          answerList.splice(i, 1, childData)
          addTo = false

          break
        }
      }

      if (addTo) {
        answerList.push(childData)
      }

      setAnswerList(answerList)
      if (answerList.length === subSegmentCount) {
        setAnswerListShow(true)
        if (showSubmitCount === 0) {
          setShowSubmitModal(true)
        }
      }
    } catch (err) {
      console.log('err' + err.message)
    }
  }
  //add warning styling if the timer reaches 10 seconds
  const warningText = async () => {
    // $('.timerdiv').addClass('warning')
  }

  useEffect(() => {
    getQuestions()
    getAllQuestions()

    if (newQuestion !== props.newQuestion && props.newQuestion !== undefined) {
      console.log('in set new question')
      setNewQuestion(props.newQuestion)
      addNewQuestion(props.newQuestion)
    }
    if (
      newCorrectQuestion !== props.newCorrectQuestion &&
      props.newCorrectQuestion !== undefined
    ) {
      console.log('new correct question')
      setNewQuestion(props.newCorrectQuestion)
    }
  }, [props.newQuestion, props.newCorrectQuestion])
  const addNewQuestion = question => {
    var questionidsIndex = questionids.indexOf(question.sfid)
    if (questionidsIndex === -1) {
      if (questions.length > 0 && questions.length === allquestions.length) {
      } else {
        var newquestions = questions
        console.log('call parts answers in add new question')

        var newquestionids = []
        for (var i = 0; i < allquestions.length; i++) {
          if (newquestions.length > i) {
            if (newquestions[i].sfid === question.sfid) {
              newquestions.splice(i, 1, question)
              continue
            }
          }
          if (allquestions[i].sfid === question.sfid) {
            if (allquestions.length === newquestions.length) {
              break
            } else {
              newquestions.push(question)
              newquestionids.push(question.sfid)
            }
          }
        }

        setPublishedQuestions(newquestions.length)
        setQuestionIds(newquestionids)
        setQuestions(newquestions)

        setTimeout(function () {
          console.log('timeout part answers')
          doGetParticipationWrongAnswers()
        }, 5000)
        setTimer()
        // $('.timerdiv').removeClass('hiddenTimer')
        resetLogic()
      }
    } else {
      if (question.islocked__c) {
        console.log('question is locked, dont do anything')
      } else {
        setTimeout(function () {
          console.log('timeout part answers')
          doGetParticipationWrongAnswers()
        }, 5000)

        const tempQuestions = questions
        tempQuestions[tempQuestions.map(r => r.sfid).indexOf(question.sfid)] =
          question
        setQuestions(tempQuestions)
        setTimer()
      }
    }
  }

  return (
    <>
      {/* Show timer and answer count */}
      {questions.length > 0 && (
        <Row className='questionRow m-2 p-2'>
          {/* slide for questions */}
          {questions.length !== 0 && (
            <Col xs={6} className='justify-content-start no-padding'>
              <div key={counter}>
                <Timer
                  initialTime={counter}
                  direction='backward'
                  lastUnit='s'
                  checkpoints={[
                    {
                      time: 0,
                      callback: () => disableQuestions()
                    },
                    {
                      time: 10000,
                      callback: () => warningText()
                    }
                  ]}
                >
                  {({
                    start,
                    resume,
                    pause,
                    stop,
                    reset,
                    getTimerState,
                    getTime,
                    setTime,
                    timerState
                  }) => (
                    <React.Fragment>
                      {/* on timer state of stopped, call the disable function and show answer*/}
                      {counter > 0 && (
                        <div className='timerdiv font16'>
                          {props.sport == 'Baseball' && (
                            <Image width='20' src={baseball} />
                          )}
                          {props.sport == 'Football' && (
                            <Image width='20' src={football} />
                          )}
                          {props.sport == 'Basketball' && (
                            <Image width='20' src={basketball} />
                          )}
                          <Timer.Seconds /> Seconds
                          {props.sport == 'Baseball' && (
                            <Image width='20' src={baseball} />
                          )}
                          {props.sport == 'Football' && (
                            <Image width='20' src={football} />
                          )}
                          {props.sport == 'Basketball' && (
                            <Image width='20' src={basketball} />
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  )}
                </Timer>
                {review && !showContestFinished && (
                  <div className='gameBanner font16 text-center'>
                    <Row className='rowHeight'>
                      <Col xs={3} lg={4}>
                        <div className='liveBtnLeft float-right'></div>
                      </Col>
                      <Col xs={6} lg={4}>
                        <h5 className='liveBtnMiddle'>Live</h5>
                      </Col>
                      <Col xs={3} lg={4}>
                        <div className='liveBtnRight '></div>
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
            </Col>
          )}

          {partWrongAnswer.wrong_answers_allowed__c && showAnswer && (
            <Col xs={6} className='justify-content-start no-padding'>
              <Answers
                wrong={partWrongAnswer.wrong_answers__c}
                total={partWrongAnswer.wrong_answers_allowed__c}
              />
            </Col>
          )}
        </Row>
      )}
      {isShowWaiting && (
        <Row className='questionRow m-2 p-2'>
          <Col>
            <div className='proxima font16 text-center'>
              <img width='30' src={hourglass} />

              <span>{props.contest.waiting_text__c}</span>
            </div>
          </Col>
        </Row>
      )}
      {/* show questions or no question text */}
      {!isShowWaiting && (
        <Row className='questionRow m-2 p-2 justify-content-center'>
          {showEndBanner && placeFin && (
            <Col sm={12} lg={12} className='endtextbanner text-center font16'>
              <span class='proxima'>Thanks For Playing</span>
              <br />
              <span class='proxima'>Place Finish: {placeFin}</span>
            </Col>
          )}
          <Col sm={12} lg={12}>
            {questions.length > 0 && showAnswer && (
              <Carousel
                className='carouselDiv'
                ref={carouselRef}
                activeIndex={index}
                onSelect={handleSelect}
                interval={null}
                data-slide-to={index}
              >
                {questions.map(question => {
                  return (
                    <Carousel.Item key={question.id} className='text-center'>
                      <Question
                        addAnswer={updateAnswerList}
                        knockoutcalloutchild={handleKnockoutChild}
                        ques={question}
                        contest={props.contest}
                        questionNum={questionNum}
                        totalQuestions={publishedQuestions}
                        isInactive={inactive}
                        getsubcount={handleSubsegmentCount}
                        partsfid={partWrongAnswer.sfid}
                        showAnswers={showAnswer}
                      />
                    </Carousel.Item>
                  )
                })}
              </Carousel>
            )}

            {questions.length === 0 && (
              <div className='greyDiv text-center proxima font16'>
                {props.contestQuestionText}
              </div>
            )}
          </Col>
        </Row>
      )}

      <Modal className='modalDiv' show={showEnd} onHide={handleEndClose}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body className='proxima font12 modalBody'>
          <div className='m-3 justify-content-start p-3'>
            {(props.isKnockedOut === true || showKnockOut === true) && (
              <Row>
                <div className='font16'>
                  <span>{contestKnockoutText}</span>
                  <br />
                  <span>Your Rank: {placeFin}</span>
                </div>
              </Row>
            )}

            {(props.isContestWon == true || showContestWon == true) && (
              <Row>
                <div className='font16'>
                  <span>{contestWonText}</span>
                </div>
              </Row>
            )}

            {(props.isContestFinished == true || showContestFinished == true) &&
              (props.isKnockedOut == false || showKnockOut == false) && (
                <Row>
                  <div className='font16'>
                    <span>{contestFinishedText}</span>
                    <br />
                    <span>Your Rank: {placeFin}</span>
                  </div>
                </Row>
              )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className='aptifer modalBtn'
            variant='secondary'
            onClick={handleEndClose}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        className='modalDiv'
        show={showSubmitModal}
        onHide={handleSubmitClose}
      >
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body className='proxima font12 modalBody'>
          <Row>
            <Col className='d-flex justify-content-center'>
              <div className='font16 mb-3'>
                Submit your Questions here or close the popup to change them
              </div>
            </Col>
          </Row>
          <Row>
            <Col className='d-flex justify-content-center'>
              <div className='d-flex justify-content-center'>
                <button
                  className={`btn btn-primary submitButton ${
                    answerListShow === false ? 'disabledSubmit' : ''
                  }`}
                  onClick={handleSubmitAnswers}
                >
                  submit answers
                </button>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className='aptifer modalBtn'
            variant='secondary'
            onClick={handleSubmitClose}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* showing submit answers button */}
      {!review && !submitted && questions.length > 0 && (
        <Row className='questionRow m-2 p-2 justify-content-center'>
          <Col xs={2} lg={4}>
            {counter > 0 && answerListShow && props.sport === 'Basketball' && (
              <Image width='35' src={basketball} className='float-right' />
            )}
            {counter > 0 && answerListShow && props.sport === 'Baseball' && (
              <Image width='35' src={baseball} className='float-right' />
            )}
            {counter > 0 && answerListShow && props.sport === 'Football' && (
              <Image width='35' src={football} className='float-right' />
            )}
          </Col>
          <Col xs={6} lg={4}>
            <button
              className={`btn btn-primary submitButton ${
                answerListShow === false ? 'disabledSubmit' : ''
              }`}
              onClick={handleSubmitAnswers}
            >
              submit answers
            </button>
          </Col>
          <Col xs={2} lg={4}>
            {counter > 0 && answerListShow && props.sport === 'Basketball' && (
              <Image width='35' src={basketball} className='float-left' />
            )}

            {counter > 0 && answerListShow && props.sport === 'Baseball' && (
              <Image width='35' src={baseball} className='float-left' />
            )}

            {counter > 0 && answerListShow && props.sport === 'Football' && (
              <Image width='35' src={football} className='float-left' />
            )}
          </Col>
        </Row>
      )}
    </>
  )
}

export default connect()(Questions)
