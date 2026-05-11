import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import VoteButtons from '../../../components/VoteButtons/VoteButtons'
import { useAuth } from '../../../hooks/useAuth'
import { useLocale } from '../../../hooks/useLocale'
import { voteService } from '../../../services/vote.service'
import { toast } from 'sonner'

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../hooks/useLocale', () => ({
  useLocale: jest.fn(),
}))

jest.mock('../../../services/vote.service', () => ({
  voteService: {
    castVote: jest.fn(),
    getUserVote: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

describe('VoteButtons component', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ isAuthenticated: true })
    useLocale.mockReturnValue({ t: (key) => key })
    voteService.getUserVote.mockResolvedValue(null)
    voteService.castVote.mockResolvedValue({ idea: { votesCount: 1 }, voteState: 1 })
  })

  test('renders initial vote count', () => {
    render(<VoteButtons targetId="idea-1" targetType="idea" initialVotesCount={5} initialVoteState={null} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('loads current user vote state when initialVoteState is null', async () => {
    voteService.getUserVote.mockResolvedValue(1)

    render(<VoteButtons targetId="idea-1" targetType="idea" initialVotesCount={2} initialVoteState={null} />)

    await waitFor(() => {
      expect(voteService.getUserVote).toHaveBeenCalledWith('idea-1', 'idea')
    })
  })

  test('casts idea vote and reports updated state to parent', async () => {
    const onVoteChange = jest.fn()
    voteService.castVote.mockResolvedValue({ idea: { votesCount: 10 }, voteState: 1 })

    render(
      <VoteButtons
        targetId="idea-1"
        targetType="idea"
        initialVotesCount={9}
        initialVoteState={null}
        onVoteChange={onVoteChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Upvote' }))

    await waitFor(() => {
      expect(voteService.castVote).toHaveBeenCalledWith('idea-1', 1, 'idea')
    })
    expect(onVoteChange).toHaveBeenCalledWith(
      expect.objectContaining({ votesCount: 10, voteState: 1 })
    )
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  test('casts comment vote and returns likes/dislikes payload', async () => {
    const onVoteChange = jest.fn()
    voteService.castVote.mockResolvedValue({
      votesCount: -2,
      voteState: -1,
      likesCount: 3,
      dislikesCount: 5,
    })

    render(
      <VoteButtons
        targetId="comment-1"
        targetType="comment"
        initialVotesCount={0}
        initialVoteState={null}
        onVoteChange={onVoteChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Downvote' }))

    await waitFor(() => {
      expect(voteService.castVote).toHaveBeenCalledWith('comment-1', -1, 'comment')
    })
    expect(onVoteChange).toHaveBeenCalledWith(
      expect.objectContaining({
        votesCount: -2,
        voteState: -1,
        likesCount: 3,
        dislikesCount: 5,
      })
    )
  })

  test('shows own-comment voting error when backend returns 403', async () => {
    voteService.castVote.mockRejectedValue({ status: 403 })

    render(
      <VoteButtons
        targetId="comment-1"
        targetType="comment"
        initialVotesCount={0}
        initialVoteState={null}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Upvote' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('cannotVoteOwnComment')
    })
  })
})
