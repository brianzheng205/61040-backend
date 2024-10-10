import AssociatingConcept from "./concepts/associating";
import AuthenticatingConcept from "./concepts/authenticating";
import CommentingConcept from "./concepts/commenting";
import CompetingConcept from "./concepts/competing";
import FriendingConcept from "./concepts/friending";
import JoiningConcept from "./concepts/joining";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
import TrackingConcept from "./concepts/tracking";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Associating = new AssociatingConcept("associations");
export const Authing = new AuthenticatingConcept("users");
export const Commenting = new CommentingConcept("comments");
export const Competing = new CompetingConcept("competitions");
export const Friending = new FriendingConcept("friends");
export const Joining = new JoiningConcept("groups");
export const Posting = new PostingConcept("posts");
export const Sessioning = new SessioningConcept();
export const Tracking = new TrackingConcept("data");
